import { DatabaseManager } from '../database/DatabaseManager';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { Transaction, AIParsedExpense } from '../types';

export class ExpenseEngine {
  constructor(private db: DatabaseManager) {}

  async recordExpense(userId: string, data: AIParsedExpense, rawInput?: string): Promise<Transaction> {
    const user = this.db.findById('users', userId);
    if (!user) throw new Error('User not found');

    // Resolve category
    const categories = this.db.findWhere('categories', (c) => c.userId === userId);
    const category = categories.find(
      (c) => c.name.toLowerCase() === data.category.toLowerCase(),
    ) || categories.find((c) => c.name.toLowerCase() === 'lainnya');

    const transaction: Transaction = {
      id: generateId(),
      userId,
      type: 'expense',
      amount: data.amount,
      categoryId: category?.id || 'cat-lainnya',
      description: data.description,
      note: data.note,
      date: data.date ? new Date(data.date).toISOString() : nowISO(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      aiParsed: true,
      rawInput,
    };

    // Deduct from balance
    const newBalance = user.balance - data.amount;
    await this.db.update('users', userId, { balance: newBalance, updatedAt: nowISO() });

    await this.db.create('transactions', transaction);

    // Update budget spending
    await this.updateBudget(userId, category?.id || '', data.amount);

    logger.info('[Expense] Recorded', { userId, amount: data.amount, category: data.category });

    return transaction;
  }

  async recordManual(
    userId: string,
    data: {
      amount: number;
      categoryId: string;
      description: string;
      note?: string;
      date?: string;
    },
  ): Promise<Transaction> {
    const user = this.db.findById('users', userId);
    if (!user) throw new Error('User not found');

    const transaction: Transaction = {
      id: generateId(),
      userId,
      type: 'expense',
      amount: data.amount,
      categoryId: data.categoryId,
      description: data.description,
      note: data.note,
      date: data.date ? new Date(data.date).toISOString() : nowISO(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      aiParsed: false,
    };

    await this.db.update('users', userId, {
      balance: user.balance - data.amount,
      updatedAt: nowISO(),
    });

    await this.db.create('transactions', transaction);
    await this.updateBudget(userId, data.categoryId, data.amount);

    return transaction;
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<Pick<Transaction, 'amount' | 'categoryId' | 'description' | 'note' | 'date'>>,
  ): Promise<Transaction | null> {
    const existing = this.db.findById('transactions', transactionId) as Transaction | undefined;
    if (!existing || existing.userId !== userId || existing.type !== 'expense') return null;

    // Recalculate balance diff
    if (updates.amount !== undefined) {
      const user = this.db.findById('users', userId);
      if (user) {
        const diff = existing.amount - updates.amount;
        await this.db.update('users', userId, { balance: user.balance + diff, updatedAt: nowISO() });
      }
    }

    const updated = await this.db.update('transactions', transactionId, {
      ...updates,
      updatedAt: nowISO(),
    });

    return updated as Transaction | null;
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
    const tx = this.db.findById('transactions', transactionId) as Transaction | undefined;
    if (!tx || tx.userId !== userId || tx.type !== 'expense') return false;

    const user = this.db.findById('users', userId);
    if (user) {
      await this.db.update('users', userId, {
        balance: user.balance + tx.amount,
        updatedAt: nowISO(),
      });
    }

    return this.db.delete('transactions', transactionId);
  }

  getExpenses(
    userId: string,
    filters?: { month?: number; year?: number; categoryId?: string; limit?: number },
  ): Transaction[] {
    let expenses = this.db.findWhere(
      'transactions',
      (t) => (t as Transaction).userId === userId && (t as Transaction).type === 'expense',
    ) as Transaction[];

    if (filters?.month && filters?.year) {
      expenses = expenses.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === filters.month && d.getFullYear() === filters.year;
      });
    }

    if (filters?.categoryId) {
      expenses = expenses.filter((t) => t.categoryId === filters.categoryId);
    }

    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters?.limit) {
      expenses = expenses.slice(0, filters.limit);
    }

    return expenses;
  }

  private async updateBudget(userId: string, categoryId: string, amount: number): Promise<void> {
    const now = new Date();
    const budget = (this.db.findWhere('budgets', (b) => {
      return (
        b.userId === userId &&
        b.categoryId === categoryId &&
        b.month === now.getMonth() + 1 &&
        b.year === now.getFullYear()
      );
    }) as import('../types').Budget[])[0];

    if (budget) {
      const newSpent = budget.spent + amount;
      await this.db.update('budgets', budget.id, { spent: newSpent, updatedAt: nowISO() });
    }
  }
}
