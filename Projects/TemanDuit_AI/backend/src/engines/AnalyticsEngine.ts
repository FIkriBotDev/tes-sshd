import { DatabaseManager } from '../database/DatabaseManager';
import { percentage } from '../utils/helpers';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import type {
  AnalyticsData,
  FinancialSummary,
  TrendData,
  CategoryBreakdown,
  DailySpending,
  Transaction,
  Budget,
} from '../types';

export class AnalyticsEngine {
  constructor(private db: DatabaseManager) {}

  getFinancialSummary(userId: string, month: number, year: number): FinancialSummary {
    const user = this.db.findById('users', userId);
    if (!user) throw new Error('User not found');

    const transactions = this.db.findWhere('transactions', (t) => {
      const d = new Date((t as Transaction).date);
      return (
        (t as Transaction).userId === userId &&
        d.getMonth() + 1 === month &&
        d.getFullYear() === year
      );
    }) as Transaction[];

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpense;
    const savingRate = percentage(netSavings > 0 ? netSavings : 0, totalIncome);

    const budgets = this.db.findWhere('budgets', (b) => {
      return b.userId === userId && b.month === month && b.year === year;
    }) as Budget[];

    const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
    const totalBudgetSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const budgetUsage = percentage(totalBudgetSpent, totalBudgeted);

    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const daysInMonth = new Date(year, month, 0).getDate();
    const averageDailySpending = totalExpense / daysInMonth;

    // Category breakdown
    const categoryMap: Record<string, { total: number; count: number; name: string }> = {};
    for (const tx of expenseTransactions) {
      const cat = this.db.findById('categories', tx.categoryId);
      const catName = cat?.name || 'Lainnya';
      if (!categoryMap[tx.categoryId]) {
        categoryMap[tx.categoryId] = { total: 0, count: 0, name: catName };
      }
      categoryMap[tx.categoryId].total += tx.amount;
      categoryMap[tx.categoryId].count += 1;
    }

    const entries = Object.entries(categoryMap);
    const mostExpensive = entries.sort((a, b) => b[1].total - a[1].total)[0];
    const mostFrequent = entries.sort((a, b) => b[1].count - a[1].count)[0];

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingRate,
      budgetUsage,
      averageDailySpending: Math.round(averageDailySpending),
      mostExpensiveCategory: mostExpensive?.[1].name || '-',
      mostFrequentCategory: mostFrequent?.[1].name || '-',
      balance: user.balance,
      savingBalance: user.savingBalance,
    };
  }

  getIncomeTrend(userId: string, months: number = 6): TrendData[] {
    return this.getTransactionTrend(userId, 'income', months);
  }

  getExpenseTrend(userId: string, months: number = 6): TrendData[] {
    return this.getTransactionTrend(userId, 'expense', months);
  }

  private getTransactionTrend(userId: string, type: 'income' | 'expense', months: number): TrendData[] {
    const result: TrendData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const txs = this.db.findWhere('transactions', (t) => {
        const txDate = new Date((t as Transaction).date);
        return (
          (t as Transaction).userId === userId &&
          (t as Transaction).type === type &&
          txDate.getMonth() + 1 === m &&
          txDate.getFullYear() === y
        );
      }) as Transaction[];

      result.push({
        period: `${y}-${String(m).padStart(2, '0')}`,
        amount: txs.reduce((s, t) => s + t.amount, 0),
        count: txs.length,
      });
    }

    return result;
  }

  getSavingTrend(userId: string, months: number = 6): TrendData[] {
    const result: TrendData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const txs = this.db.findWhere('savingTransactions', (t) => {
        const txDate = new Date(t.createdAt);
        return (
          t.userId === userId &&
          txDate.getMonth() + 1 === m &&
          txDate.getFullYear() === y
        );
      });

      const deposited = txs
        .filter((t) => t.type === 'deposit')
        .reduce((s, t) => s + t.amount, 0);

      result.push({
        period: `${y}-${String(m).padStart(2, '0')}`,
        amount: deposited,
        count: txs.filter((t) => t.type === 'deposit').length,
      });
    }

    return result;
  }

  getBudgetTrend(userId: string, months: number = 6): TrendData[] {
    const result: TrendData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const budgets = this.db.findWhere('budgets', (b) => {
        return b.userId === userId && b.month === m && b.year === y;
      }) as Budget[];

      const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
      const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);

      result.push({
        period: `${y}-${String(m).padStart(2, '0')}`,
        amount: totalSpent,
        count: Math.round(percentage(totalSpent, totalBudgeted)),
      });
    }

    return result;
  }

  getDailySpending(userId: string, month: number, year: number): DailySpending[] {
    const start = startOfMonth(new Date(year, month - 1, 1));
    const end = endOfMonth(start);
    const days = eachDayOfInterval({ start, end });

    const allExpenses = this.db.findWhere('transactions', (t) => {
      const d = new Date((t as Transaction).date);
      return (
        (t as Transaction).userId === userId &&
        (t as Transaction).type === 'expense' &&
        d.getMonth() + 1 === month &&
        d.getFullYear() === year
      );
    }) as Transaction[];

    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTxs = allExpenses.filter((t) => {
        return format(new Date(t.date), 'yyyy-MM-dd') === dayStr;
      });

      return {
        date: dayStr,
        amount: dayTxs.reduce((s, t) => s + t.amount, 0),
        transactions: dayTxs.length,
      };
    });
  }

  getCategoryBreakdown(userId: string, month: number, year: number): CategoryBreakdown[] {
    const expenses = this.db.findWhere('transactions', (t) => {
      const d = new Date((t as Transaction).date);
      return (
        (t as Transaction).userId === userId &&
        (t as Transaction).type === 'expense' &&
        d.getMonth() + 1 === month &&
        d.getFullYear() === year
      );
    }) as Transaction[];

    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const map: Record<string, { amount: number; count: number; name: string }> = {};

    for (const tx of expenses) {
      const cat = this.db.findById('categories', tx.categoryId);
      const catName = cat?.name || 'Lainnya';
      if (!map[tx.categoryId]) {
        map[tx.categoryId] = { amount: 0, count: 0, name: catName };
      }
      map[tx.categoryId].amount += tx.amount;
      map[tx.categoryId].count += 1;
    }

    return Object.entries(map)
      .map(([id, val]) => ({
        categoryId: id,
        categoryName: val.name,
        amount: val.amount,
        percentage: percentage(val.amount, totalExpense),
        count: val.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  getFullAnalytics(userId: string, month: number, year: number): AnalyticsData {
    return {
      summary: this.getFinancialSummary(userId, month, year),
      incomeTrend: this.getIncomeTrend(userId),
      expenseTrend: this.getExpenseTrend(userId),
      savingTrend: this.getSavingTrend(userId),
      budgetTrend: this.getBudgetTrend(userId),
      dailySpending: this.getDailySpending(userId, month, year),
      categoryBreakdown: this.getCategoryBreakdown(userId, month, year),
    };
  }
}
