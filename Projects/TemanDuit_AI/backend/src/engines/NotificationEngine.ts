import { DatabaseManager } from '../database/DatabaseManager';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { Notification, NotificationType, Budget } from '../types';

export class NotificationEngine {
  constructor(private db: DatabaseManager) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string,
  ): Promise<Notification> {
    const notification: Notification = {
      id: generateId(),
      userId,
      type,
      title,
      message,
      isRead: false,
      sentToTelegram: false,
      relatedId,
      createdAt: nowISO(),
    };

    await this.db.create('notifications', notification);
    logger.info('[Notification] Created', { userId, type, title });
    return notification;
  }

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const notif = this.db.findById('notifications', notificationId) as Notification | undefined;
    if (!notif || notif.userId !== userId) return false;
    await this.db.update('notifications', notificationId, { isRead: true });
    return true;
  }

  async markAllRead(userId: string): Promise<void> {
    const unread = this.db.findWhere('notifications', (n) => {
      return n.userId === userId && !n.isRead;
    }) as Notification[];

    for (const n of unread) {
      await this.db.update('notifications', n.id, { isRead: true });
    }
  }

  async markTelegramSent(notificationId: string): Promise<void> {
    await this.db.update('notifications', notificationId, { sentToTelegram: true });
  }

  getNotifications(userId: string, unreadOnly = false): Notification[] {
    return (this.db.findWhere('notifications', (n) => {
      if (unreadOnly) return n.userId === userId && !n.isRead;
      return n.userId === userId;
    }) as Notification[]).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getUnreadCount(userId: string): number {
    return this.db.findWhere('notifications', (n) => n.userId === userId && !n.isRead).length;
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const notif = this.db.findById('notifications', notificationId) as Notification | undefined;
    if (!notif || notif.userId !== userId) return false;
    return this.db.delete('notifications', notificationId);
  }

  async checkBudgetWarnings(userId: string): Promise<Notification[]> {
    const now = new Date();
    const budgets = this.db.findWhere('budgets', (b) => {
      return b.userId === userId && b.month === now.getMonth() + 1 && b.year === now.getFullYear();
    }) as Budget[];

    const notifications: Notification[] = [];

    for (const budget of budgets) {
      const total = budget.amount + budget.rolledAmount;
      const usagePercent = total > 0 ? (budget.spent / total) * 100 : 0;
      const cat = this.db.findById('categories', budget.categoryId);
      const catName = cat?.name || 'Kategori';

      if (usagePercent >= 100) {
        const existing = this.db.findWhere('notifications', (n) => {
          return (
            n.userId === userId &&
            n.type === 'budget_exceeded' &&
            n.relatedId === budget.id
          );
        });

        if (existing.length === 0) {
          const notif = await this.create(
            userId,
            'budget_exceeded',
            `Budget ${catName} Habis!`,
            `Budget ${catName} kamu sudah habis. Pengeluaran: ${this.formatCurrency(budget.spent)} dari ${this.formatCurrency(total)}.`,
            budget.id,
          );
          notifications.push(notif);
        }
      } else if (usagePercent >= 80) {
        const existing = this.db.findWhere('notifications', (n) => {
          return (
            n.userId === userId &&
            n.type === 'budget_warning' &&
            n.relatedId === budget.id
          );
        });

        if (existing.length === 0) {
          const notif = await this.create(
            userId,
            'budget_warning',
            `Budget ${catName} Hampir Habis`,
            `Budget ${catName} sudah terpakai ${Math.round(usagePercent)}%. Sisa: ${this.formatCurrency(total - budget.spent)}.`,
            budget.id,
          );
          notifications.push(notif);
        }
      }
    }

    return notifications;
  }

  async notifyLargeExpense(
    userId: string,
    amount: number,
    description: string,
    transactionId: string,
  ): Promise<void> {
    const user = this.db.findById('users', userId);
    if (!user || user.balance === 0) return;

    // Notify if expense > 20% of current balance
    const threshold = user.balance * 0.2;
    if (amount > threshold) {
      await this.create(
        userId,
        'large_expense',
        'Pengeluaran Besar',
        `Kamu baru saja mengeluarkan ${this.formatCurrency(amount)} untuk ${description}. Ini ${Math.round((amount / user.balance) * 100)}% dari saldo kamu.`,
        transactionId,
      );
    }
  }

  async notifySavingGoalReached(
    userId: string,
    goalName: string,
    targetAmount: number,
    goalId: string,
  ): Promise<void> {
    await this.create(
      userId,
      'saving_goal_reached',
      '🎉 Target Tabungan Tercapai!',
      `Selamat! Kamu sudah mencapai target tabungan "${goalName}" sebesar ${this.formatCurrency(targetAmount)}.`,
      goalId,
    );
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
