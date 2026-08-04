import { DatabaseManager } from '../database/DatabaseManager';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { Transaction, AIParsedIncome, IncomeSource } from '../types';

export class IncomeEngine {
  constructor(private db: DatabaseManager) {}

  async recordIncome(userId: string, data: AIParsedIncome, rawInput?: string): Promise<Transaction> {
    const user = this.db.findById('users', userId);
    if (!user) throw new Error('User not found');

    // Find income category
    const categories = this.db.findWhere('categories', (c) => c.userId === userId);
    const category = categories.find((c) => c.name.toLowerCase() === 'lainnya');

    const transaction: Transaction = {
      id: generateId(),
      userId,
      type: 'income',
      amount: data.amount,
      categoryId: category?.id || 'cat-lainnya',
      description: data.description,
      note: data.note,
      date: data.date ? new Date(data.date).toISOString() : nowISO(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      source: data.source,
      aiParsed: true,
      rawInput,
    };

    // Add to balance
    const newBalance = user.balance + data.amount;
    await this.db.update('users', userId, { balance: newBalance, updatedAt: nowISO() });

    await this.db.create('transactions', transaction);

    logger.info('[Income] Recorded', { userId, amount: data.amount, source: data.source });

    return transaction;
  }

  async recordManual(
    userId: string,
    data: {
      amount: number;
      source: IncomeSource;
      description: string;
      note?: string;
      date?: string;
    },
  ): Promise<Transaction> {
    const user = this.db.findById('users', userId);
    if (!user) throw new Error('User not found');

    const categories = this.db.findWhere('categories', (c) => c.userId === userId);
    const category = categories.find((c) => c.name.toLowerCase() === 'lainnya');

    const transaction: Transaction = {
      id: generateId(),
      userId,
      type: 'income',
      amount: data.amount,
      categoryId: category?.id || 'cat-lainnya',
      description: data.description,
      note: data.note,
      date: data.date ? new Date(data.date).toISOString() : nowISO(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      source: data.source,
      aiParsed: false,
    };

    await this.db.update('users', userId, {
      balance: user.balance + data.amount,
      updatedAt: nowISO(),
    });

    await this.db.create('transactions', transaction);
    return transaction;
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<Pick<Transaction, 'amount' | 'description' | 'note' | 'date' | 'source'>>,
  ): Promise<Transaction | null> {
    const existing = this.db.findById('transactions', transactionId) as Transaction | undefined;
    if (!existing || existing.userId !== userId || existing.type !== 'income') return null;

    if (updates.amount !== undefined) {
      const user = this.db.findById('users', userId);
      if (user) {
        const diff = updates.amount - existing.amount;
        await this.db.update('users', userId, { balance: user.balance + diff, updatedAt: nowISO() });
      }
    }

    return this.db.update('transactions', transactionId, { ...updates, updatedAt: nowISO() }) as Promise<Transaction | null>;
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
    const tx = this.db.findById('transactions', transactionId) as Transaction | undefined;
    if (!tx || tx.userId !== userId || tx.type !== 'income') return false;

    const user = this.db.findById('users', userId);
    if (user) {
      await this.db.update('users', userId, {
        balance: user.balance - tx.amount,
        updatedAt: nowISO(),
      });
    }

    return this.db.delete('transactions', transactionId);
  }

  getIncomes(
    userId: string,
    filters?: { month?: number; year?: number; source?: IncomeSource; limit?: number },
  ): Transaction[] {
    let incomes = this.db.findWhere(
      'transactions',
      (t) => (t as Transaction).userId === userId && (t as Transaction).type === 'income',
    ) as Transaction[];

    if (filters?.month && filters?.year) {
      incomes = incomes.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === filters.month && d.getFullYear() === filters.year;
      });
    }

    if (filters?.source) {
      incomes = incomes.filter((t) => t.source === filters.source);
    }

    incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters?.limit) {
      incomes = incomes.slice(0, filters.limit);
    }

    return incomes;
  }

  getTotalIncome(userId: string, month: number, year: number): number {
    return this.getIncomes(userId, { month, year }).reduce((sum, t) => sum + t.amount, 0);
  }
}
