import { DatabaseManager } from '../database/DatabaseManager';
import { generateId, nowISO, TIMEZONE_MAP } from '../utils/helpers';
import { logger } from '../utils/logger';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Reminder, AIParsedReminder, Timezone, ReminderFrequency } from '../types';

export class ReminderEngine {
  constructor(private db: DatabaseManager) {}

  async createReminder(userId: string, data: AIParsedReminder | {
    type: import('../types').ReminderType;
    title: string;
    description?: string;
    amount?: number;
    frequency: ReminderFrequency;
    dueDate: string;
    relatedId?: string;
  }): Promise<Reminder> {
    const reminder: Reminder = {
      id: generateId(),
      userId,
      type: data.type,
      title: data.title,
      description: data.description,
      amount: data.amount,
      frequency: data.frequency,
      dueDate: new Date(data.dueDate).toISOString(),
      nextTrigger: new Date(data.dueDate).toISOString(),
      isActive: true,
      relatedId: (data as { relatedId?: string }).relatedId,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    await this.db.create('reminders', reminder);
    logger.info('[Reminder] Created', { userId, title: data.title, frequency: data.frequency });
    return reminder;
  }

  async updateReminder(
    userId: string,
    reminderId: string,
    updates: Partial<Pick<Reminder, 'title' | 'description' | 'amount' | 'frequency' | 'dueDate' | 'isActive'>>,
  ): Promise<Reminder | null> {
    const reminder = this.db.findById('reminders', reminderId) as Reminder | undefined;
    if (!reminder || reminder.userId !== userId) return null;

    const payload: Partial<Reminder> = { ...updates, updatedAt: nowISO() };
    if (updates.dueDate) {
      payload.nextTrigger = new Date(updates.dueDate).toISOString();
    }

    return this.db.update('reminders', reminderId, payload) as Promise<Reminder | null>;
  }

  async deleteReminder(userId: string, reminderId: string): Promise<boolean> {
    const reminder = this.db.findById('reminders', reminderId) as Reminder | undefined;
    if (!reminder || reminder.userId !== userId) return false;
    return this.db.delete('reminders', reminderId);
  }

  getReminders(userId: string, activeOnly = false): Reminder[] {
    return this.db.findWhere('reminders', (r) => {
      const base = r.userId === userId;
      if (activeOnly) return base && r.isActive;
      return base;
    }) as Reminder[];
  }

  getReminderById(userId: string, reminderId: string): Reminder | null {
    const reminder = this.db.findById('reminders', reminderId) as Reminder | undefined;
    if (!reminder || reminder.userId !== userId) return null;
    return reminder;
  }

  getDueReminders(): Reminder[] {
    const now = nowISO();
    return this.db.findWhere('reminders', (r) => {
      return r.isActive && r.nextTrigger <= now;
    }) as Reminder[];
  }

  async markTriggered(reminderId: string): Promise<void> {
    const reminder = this.db.findById('reminders', reminderId) as Reminder | undefined;
    if (!reminder) return;

    const nextTrigger = this.calculateNextTrigger(reminder.nextTrigger, reminder.frequency);

    if (reminder.frequency === 'once') {
      await this.db.update('reminders', reminderId, {
        isActive: false,
        lastTriggered: nowISO(),
        updatedAt: nowISO(),
      });
    } else {
      await this.db.update('reminders', reminderId, {
        lastTriggered: nowISO(),
        nextTrigger,
        updatedAt: nowISO(),
      });
    }
  }

  private calculateNextTrigger(current: string, frequency: ReminderFrequency): string {
    const date = new Date(current);
    switch (frequency) {
      case 'daily':
        return addDays(date, 1).toISOString();
      case 'weekly':
        return addWeeks(date, 1).toISOString();
      case 'monthly':
        return addMonths(date, 1).toISOString();
      case 'yearly':
        return addYears(date, 1).toISOString();
      default:
        return date.toISOString();
    }
  }

  getUpcomingReminders(userId: string, days: number = 7): Reminder[] {
    const futureDate = addDays(new Date(), days).toISOString();
    const now = nowISO();

    return (this.db.findWhere('reminders', (r) => {
      return r.userId === userId && r.isActive && r.nextTrigger >= now && r.nextTrigger <= futureDate;
    }) as Reminder[]).sort((a, b) =>
      new Date(a.nextTrigger).getTime() - new Date(b.nextTrigger).getTime(),
    );
  }

  formatReminderForTelegram(reminder: Reminder, timezone: Timezone): string {
    const tz = TIMEZONE_MAP[timezone];
    const date = toZonedTime(new Date(reminder.nextTrigger), tz);
    const dateStr = format(date, 'dd MMM yyyy HH:mm');

    let msg = `⏰ *${reminder.title}*\n`;
    if (reminder.description) msg += `📝 ${reminder.description}\n`;
    if (reminder.amount) {
      const amt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(reminder.amount);
      msg += `💵 ${amt}\n`;
    }
    msg += `📅 ${dateStr} (${timezone})\n`;
    msg += `🔄 ${this.frequencyLabel(reminder.frequency)}`;

    return msg;
  }

  private frequencyLabel(freq: ReminderFrequency): string {
    const map: Record<ReminderFrequency, string> = {
      once: 'Sekali',
      daily: 'Harian',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      yearly: 'Tahunan',
    };
    return map[freq];
  }
}
