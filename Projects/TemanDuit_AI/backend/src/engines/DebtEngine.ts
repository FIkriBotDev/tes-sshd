import { DatabaseManager } from '../database/DatabaseManager';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { Debt, DebtPayment, AIParsedDebt, DebtStatus } from '../types';

export class DebtEngine {
  constructor(private db: DatabaseManager) {}

  async createDebt(userId: string, data: AIParsedDebt | {
    type: 'debt' | 'receivable' | 'installment';
    counterpartyName: string;
    amount: number;
    description: string;
    dueDate?: string;
    installmentAmount?: number;
    installmentFrequency?: import('../types').ReminderFrequency;
  }): Promise<Debt> {
    const debt: Debt = {
      id: generateId(),
      userId,
      type: data.type as Debt['type'],
      counterpartyName: data.counterpartyName,
      amount: data.amount,
      remainingAmount: data.amount,
      paidAmount: 0,
      description: data.description,
      dueDate: data.dueDate,
      status: 'ACTIVE',
      installmentAmount: (data as Debt).installmentAmount,
      installmentFrequency: (data as Debt).installmentFrequency,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    await this.db.create('debts', debt);
    logger.info('[Debt] Created', { userId, type: data.type, amount: data.amount });
    return debt;
  }

  async recordPayment(
    userId: string,
    debtId: string,
    amount: number,
    note?: string,
  ): Promise<{ debt: Debt; payment: DebtPayment }> {
    const debt = this.db.findById('debts', debtId) as Debt | undefined;
    if (!debt || debt.userId !== userId) throw new Error('Debt not found');
    if (debt.status === 'PAID' || debt.status === 'CANCELLED') {
      throw new Error('Hutang sudah lunas atau dibatalkan');
    }

    const payment: DebtPayment = {
      id: generateId(),
      debtId,
      userId,
      amount,
      note,
      paidAt: nowISO(),
    };

    await this.db.create('debtPayments', payment);

    const newPaid = debt.paidAmount + amount;
    const newRemaining = debt.remainingAmount - amount;

    let newStatus: DebtStatus = 'PARTIAL';
    if (newRemaining <= 0) newStatus = 'PAID';
    if (newPaid === 0) newStatus = 'ACTIVE';

    const updatedDebt = await this.db.update('debts', debtId, {
      paidAmount: newPaid,
      remainingAmount: Math.max(newRemaining, 0),
      status: newStatus,
      updatedAt: nowISO(),
    }) as Debt;

    // Deduct from balance for debt payment
    if (debt.type === 'debt') {
      const user = this.db.findById('users', userId);
      if (user) {
        await this.db.update('users', userId, {
          balance: user.balance - amount,
          updatedAt: nowISO(),
        });
      }
    }

    // Add to balance for receivable collection
    if (debt.type === 'receivable') {
      const user = this.db.findById('users', userId);
      if (user) {
        await this.db.update('users', userId, {
          balance: user.balance + amount,
          updatedAt: nowISO(),
        });
      }
    }

    logger.info('[Debt] Payment recorded', { debtId, amount, newStatus });
    return { debt: updatedDebt, payment };
  }

  async updateDebt(
    userId: string,
    debtId: string,
    updates: Partial<Pick<Debt, 'counterpartyName' | 'description' | 'dueDate' | 'status' | 'installmentAmount' | 'installmentFrequency'>>,
  ): Promise<Debt | null> {
    const debt = this.db.findById('debts', debtId) as Debt | undefined;
    if (!debt || debt.userId !== userId) return null;
    return this.db.update('debts', debtId, { ...updates, updatedAt: nowISO() }) as Promise<Debt | null>;
  }

  async cancelDebt(userId: string, debtId: string): Promise<Debt | null> {
    return this.updateDebt(userId, debtId, { status: 'CANCELLED' });
  }

  async checkOverdue(): Promise<void> {
    const now = new Date().toISOString();
    const activeDebts = this.db.findWhere('debts', (d) => {
      return (
        (d.status === 'ACTIVE' || d.status === 'PARTIAL') &&
        d.dueDate !== undefined &&
        d.dueDate < now
      );
    }) as Debt[];

    for (const debt of activeDebts) {
      await this.db.update('debts', debt.id, { status: 'OVERDUE', updatedAt: nowISO() });
    }

    if (activeDebts.length > 0) {
      logger.info('[Debt] Overdue check', { count: activeDebts.length });
    }
  }

  getDebts(userId: string, filters?: { status?: DebtStatus; type?: Debt['type'] }): Debt[] {
    return this.db.findWhere('debts', (d) => {
      const base = d.userId === userId;
      if (filters?.status && d.status !== filters.status) return false;
      if (filters?.type && d.type !== filters.type) return false;
      return base;
    }) as Debt[];
  }

  getDebtById(userId: string, debtId: string): Debt | null {
    const debt = this.db.findById('debts', debtId) as Debt | undefined;
    if (!debt || debt.userId !== userId) return null;
    return debt;
  }

  getPaymentHistory(userId: string, debtId: string): DebtPayment[] {
    return this.db.findWhere(
      'debtPayments',
      (p) => p.debtId === debtId && p.userId === userId,
    ) as DebtPayment[];
  }

  getTotalDebt(userId: string): number {
    return this.getDebts(userId, { type: 'debt' })
      .filter((d) => d.status !== 'PAID' && d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
  }

  getTotalReceivable(userId: string): number {
    return this.getDebts(userId, { type: 'receivable' })
      .filter((d) => d.status !== 'PAID' && d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + d.remainingAmount, 0);
  }
}
