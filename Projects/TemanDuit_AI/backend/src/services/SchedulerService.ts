import cron from 'node-cron';
import { DatabaseManager } from '../database/DatabaseManager';
import { ReminderEngine } from '../engines/ReminderEngine';
import { DebtEngine } from '../engines/DebtEngine';
import { NotificationEngine } from '../engines/NotificationEngine';
import { AuthService } from './AuthService';
import { logger } from '../utils/logger';
import type { User } from '../types';

export class SchedulerService {
  private reminderEngine: ReminderEngine;
  private debtEngine: DebtEngine;
  private notificationEngine: NotificationEngine;
  private authService: AuthService;
  private telegramSendFn?: (telegramId: string, message: string) => Promise<void>;

  constructor(
    private db: DatabaseManager,
    telegramSendFn?: (telegramId: string, message: string) => Promise<void>,
  ) {
    this.reminderEngine = new ReminderEngine(db);
    this.debtEngine = new DebtEngine(db);
    this.notificationEngine = new NotificationEngine(db);
    this.authService = new AuthService(db);
    this.telegramSendFn = telegramSendFn;
  }

  start(): void {
    // Check reminders every minute
    cron.schedule('* * * * *', async () => {
      await this.processReminders();
    });

    // Check overdue debts every hour
    cron.schedule('0 * * * *', async () => {
      await this.debtEngine.checkOverdue();
    });

    // Check budget warnings every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.checkAllUserBudgets();
    });

    logger.info('[Scheduler] Started - reminders, debt overdue, budget warnings');
  }

  private async processReminders(): Promise<void> {
    const dueReminders = this.reminderEngine.getDueReminders();
    if (dueReminders.length === 0) return;

    logger.info('[Scheduler] Processing reminders', { count: dueReminders.length });

    for (const reminder of dueReminders) {
      try {
        const user = this.db.findById('users', reminder.userId) as User | undefined;
        if (!user) continue;

        // Create notification
        const notif = await this.notificationEngine.create(
          reminder.userId,
          'reminder_due',
          `⏰ ${reminder.title}`,
          reminder.description || `Reminder: ${reminder.title}`,
          reminder.id,
        );

        // Send to Telegram
        if (this.telegramSendFn) {
          const msg = this.reminderEngine.formatReminderForTelegram(reminder, user.timezone);
          await this.telegramSendFn(user.telegramId, `⏰ *Pengingat!*\n\n${msg}`);
          await this.notificationEngine.markTelegramSent(notif.id);
        }

        await this.reminderEngine.markTriggered(reminder.id);
      } catch (err) {
        logger.error('[Scheduler] Reminder processing error', { error: err, reminderId: reminder.id });
      }
    }
  }

  private async checkAllUserBudgets(): Promise<void> {
    const users = this.db.findAll('users') as User[];

    for (const user of users) {
      try {
        const warnings = await this.notificationEngine.checkBudgetWarnings(user.id);

        for (const notif of warnings) {
          if (this.telegramSendFn && !notif.sentToTelegram) {
            const emoji = notif.type === 'budget_exceeded' ? '🔴' : '🟡';
            await this.telegramSendFn(user.telegramId, `${emoji} *${notif.title}*\n\n${notif.message}`);
            await this.notificationEngine.markTelegramSent(notif.id);
          }
        }
      } catch (err) {
        logger.error('[Scheduler] Budget check error', { error: err, userId: user.id });
      }
    }
  }
}
