import { DatabaseManager } from '../database/DatabaseManager';
import { AnalyticsEngine } from '../engines/AnalyticsEngine';
import { getCurrentMonthYear } from '../utils/helpers';
import type { AIContext, User, Transaction, Budget, Debt, SavingGoal, Reminder } from '../types';

// Builds the AI context object from backend data
// AI receives this context but never accesses DB directly

export class ContextService {
  private analyticsEngine: AnalyticsEngine;

  constructor(private db: DatabaseManager) {
    this.analyticsEngine = new AnalyticsEngine(db);
  }

  buildAIContext(userId: string): AIContext {
    const user = this.db.findById('users', userId) as User | undefined;
    if (!user) throw new Error('User not found');

    const { month, year } = getCurrentMonthYear();
    const summary = this.analyticsEngine.getFinancialSummary(userId, month, year);

    // Recent transactions (last 10)
    const recentTxs = (this.db.findWhere('transactions', (t) => t.userId === userId) as Transaction[])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((t) => {
        const cat = this.db.findById('categories', t.categoryId);
        return {
          type: t.type,
          amount: t.amount,
          category: cat?.name || 'Lainnya',
          description: t.description,
          date: t.date,
        };
      });

    // Active budgets
    const budgets = (this.db.findWhere('budgets', (b) => {
      return b.userId === userId && b.month === month && b.year === year;
    }) as Budget[]).map((b) => {
      const cat = this.db.findById('categories', b.categoryId);
      return {
        category: cat?.name || 'Lainnya',
        budgeted: b.amount,
        spent: b.spent,
        remaining: Math.max(b.amount - b.spent, 0),
      };
    });

    // Active debts
    const debts = (this.db.findWhere('debts', (d) => {
      return d.userId === userId && d.status !== 'PAID' && d.status !== 'CANCELLED';
    }) as Debt[]).map((d) => ({
      type: d.type,
      counterparty: d.counterpartyName,
      remaining: d.remainingAmount,
      dueDate: d.dueDate,
      status: d.status,
    }));

    // Saving goals
    const savingGoals = (this.db.findWhere('savingGoals', (g) => {
      return g.userId === userId && !g.isCompleted;
    }) as SavingGoal[]).map((g) => ({
      name: g.name,
      target: g.targetAmount,
      current: g.currentAmount,
      deadline: g.deadline,
    }));

    // Upcoming reminders (7 days)
    const now = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const reminders = (this.db.findWhere('reminders', (r) => {
      return r.userId === userId && r.isActive && r.nextTrigger <= future;
    }) as Reminder[])
      .sort((a, b) => new Date(a.nextTrigger).getTime() - new Date(b.nextTrigger).getTime())
      .slice(0, 5)
      .map((r) => ({
        title: r.title,
        dueDate: r.nextTrigger,
        amount: r.amount,
      }));

    return {
      user: {
        name: user.name,
        age: user.age,
        timezone: user.timezone,
        occupation: user.occupation,
        incomeSource: user.incomeSource,
        financialGoal: user.financialGoal,
        balance: user.balance,
        savingBalance: user.savingBalance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      summary,
      recentTransactions: recentTxs,
      activeBudgets: budgets,
      activeDebts: debts,
      savingGoals,
      upcomingReminders: reminders,
    };
  }
}
