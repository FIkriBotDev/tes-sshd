import { DatabaseManager } from '../database/DatabaseManager';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { Budget } from '../types';

export class BudgetEngine {
  constructor(private db: DatabaseManager) {}

  async createBudget(
    userId: string,
    data: {
      categoryId: string;
      amount: number;
      month: number;
      year: number;
      rollover?: boolean;
    },
  ): Promise<Budget> {
    // Check duplicate
    const existing = (this.db.findWhere('budgets', (b) => {
      return (
        b.userId === userId &&
        b.categoryId === data.categoryId &&
        b.month === data.month &&
        b.year === data.year
      );
    }) as Budget[])[0];

    if (existing) {
      return this.db.update('budgets', existing.id, {
        amount: data.amount,
        rollover: data.rollover ?? false,
        updatedAt: nowISO(),
      }) as Promise<Budget>;
    }

    const budget: Budget = {
      id: generateId(),
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      spent: 0,
      month: data.month,
      year: data.year,
      rollover: data.rollover ?? false,
      rolledAmount: 0,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    await this.db.create('budgets', budget);
    logger.info('[Budget] Created', { userId, categoryId: data.categoryId, amount: data.amount });
    return budget;
  }

  async updateBudget(
    userId: string,
    budgetId: string,
    updates: Partial<Pick<Budget, 'amount' | 'rollover'>>,
  ): Promise<Budget | null> {
    const budget = this.db.findById('budgets', budgetId) as Budget | undefined;
    if (!budget || budget.userId !== userId) return null;

    return this.db.update('budgets', budgetId, { ...updates, updatedAt: nowISO() }) as Promise<Budget | null>;
  }

  async deleteBudget(userId: string, budgetId: string): Promise<boolean> {
    const budget = this.db.findById('budgets', budgetId) as Budget | undefined;
    if (!budget || budget.userId !== userId) return false;
    return this.db.delete('budgets', budgetId);
  }

  getBudgets(userId: string, month?: number, year?: number): Budget[] {
    return this.db.findWhere('budgets', (b) => {
      const base = b.userId === userId;
      if (month && year) return base && b.month === month && b.year === year;
      return base;
    }) as Budget[];
  }

  getBudgetById(userId: string, budgetId: string): Budget | null {
    const budget = this.db.findById('budgets', budgetId) as Budget | undefined;
    if (!budget || budget.userId !== userId) return null;
    return budget;
  }

  getCurrentMonthBudgets(userId: string): Budget[] {
    const now = new Date();
    return this.getBudgets(userId, now.getMonth() + 1, now.getFullYear());
  }

  getBudgetProgress(budget: Budget): {
    remaining: number;
    usagePercent: number;
    isWarning: boolean;
    isExceeded: boolean;
  } {
    const remaining = budget.amount + budget.rolledAmount - budget.spent;
    const total = budget.amount + budget.rolledAmount;
    const usagePercent = total > 0 ? (budget.spent / total) * 100 : 0;

    return {
      remaining: Math.max(remaining, 0),
      usagePercent: Math.round(usagePercent * 100) / 100,
      isWarning: usagePercent >= 80 && usagePercent < 100,
      isExceeded: usagePercent >= 100,
    };
  }

  async rolloverBudgets(userId: string, month: number, year: number): Promise<void> {
    const budgets = this.getBudgets(userId, month, year).filter((b) => b.rollover);

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    for (const budget of budgets) {
      const remaining = budget.amount - budget.spent;
      if (remaining > 0) {
        await this.createBudget(userId, {
          categoryId: budget.categoryId,
          amount: budget.amount,
          month: nextMonth,
          year: nextYear,
          rollover: true,
        });

        const nextBudgets = this.getBudgets(userId, nextMonth, nextYear);
        const nextBudget = nextBudgets.find((b) => b.categoryId === budget.categoryId);
        if (nextBudget) {
          await this.db.update('budgets', nextBudget.id, {
            rolledAmount: remaining,
            updatedAt: nowISO(),
          });
        }
      }
    }

    logger.info('[Budget] Rollover done', { userId, month, year });
  }

  getBudgetHistory(userId: string, months: number = 6): Budget[] {
    const now = new Date();
    const results: Budget[] = [];

    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      results.push(...this.getBudgets(userId, m, y));
    }

    return results;
  }

  getTotalBudgeted(userId: string): number {
    const budgets = this.getCurrentMonthBudgets(userId);
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  }

  getTotalSpent(userId: string): number {
    const budgets = this.getCurrentMonthBudgets(userId);
    return budgets.reduce((sum, b) => sum + b.spent, 0);
  }
}
