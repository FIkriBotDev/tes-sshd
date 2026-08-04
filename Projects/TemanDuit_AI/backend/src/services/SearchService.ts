import { DatabaseManager } from '../database/DatabaseManager';
import type { Transaction, Debt, Reminder, Category, AIInsight } from '../types';

export interface SearchResult {
  type: 'transaction' | 'debt' | 'reminder' | 'category' | 'insight';
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
}

export class SearchService {
  constructor(private db: DatabaseManager) {}

  search(userId: string, query: string): SearchResult[] {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const results: SearchResult[] = [];

    // Search transactions
    const transactions = this.db.findWhere('transactions', (t) => {
      return (
        t.userId === userId &&
        (t.description.toLowerCase().includes(q) ||
          (t.note?.toLowerCase().includes(q) ?? false))
      );
    }) as Transaction[];

    for (const tx of transactions.slice(0, 10)) {
      const cat = this.db.findById('categories', tx.categoryId);
      results.push({
        type: 'transaction',
        id: tx.id,
        title: tx.description,
        subtitle: `${tx.type === 'income' ? '+' : '-'}${this.formatCurrency(tx.amount)} • ${cat?.name || 'Lainnya'}`,
        amount: tx.amount,
        date: tx.date,
      });
    }

    // Search debts
    const debts = this.db.findWhere('debts', (d) => {
      return (
        d.userId === userId &&
        (d.counterpartyName.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q))
      );
    }) as Debt[];

    for (const debt of debts.slice(0, 5)) {
      results.push({
        type: 'debt',
        id: debt.id,
        title: debt.counterpartyName,
        subtitle: `${debt.type} • ${debt.status} • ${this.formatCurrency(debt.remainingAmount)}`,
        amount: debt.remainingAmount,
        date: debt.dueDate,
      });
    }

    // Search reminders
    const reminders = this.db.findWhere('reminders', (r) => {
      return (
        r.userId === userId &&
        (r.title.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false))
      );
    }) as Reminder[];

    for (const rem of reminders.slice(0, 5)) {
      results.push({
        type: 'reminder',
        id: rem.id,
        title: rem.title,
        subtitle: `${rem.frequency} • ${rem.isActive ? 'Aktif' : 'Nonaktif'}`,
        amount: rem.amount,
        date: rem.nextTrigger,
      });
    }

    // Search categories
    const categories = this.db.findWhere('categories', (c) => {
      return c.userId === userId && c.name.toLowerCase().includes(q);
    }) as Category[];

    for (const cat of categories.slice(0, 3)) {
      results.push({
        type: 'category',
        id: cat.id,
        title: cat.name,
        subtitle: cat.isDefault ? 'Kategori Default' : 'Kategori Custom',
      });
    }

    // Search AI insights
    const insights = this.db.findWhere('aiInsights', (i) => {
      return (
        i.userId === userId &&
        (i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q))
      );
    }) as AIInsight[];

    for (const insight of insights.slice(0, 3)) {
      results.push({
        type: 'insight',
        id: insight.id,
        title: insight.title,
        subtitle: insight.period,
        date: insight.createdAt,
      });
    }

    return results;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
