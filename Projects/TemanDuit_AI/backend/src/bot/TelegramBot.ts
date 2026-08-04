import { Telegraf, type Context } from 'telegraf';
import { config } from '../config';
import { logger } from '../utils/logger';
import { DatabaseManager } from '../database/DatabaseManager';
import { AuthService } from '../services/AuthService';
import { ContextService } from '../services/ContextService';
import { ExpenseEngine } from '../engines/ExpenseEngine';
import { IncomeEngine } from '../engines/IncomeEngine';
import { BudgetEngine } from '../engines/BudgetEngine';
import { DebtEngine } from '../engines/DebtEngine';
import { ReminderEngine } from '../engines/ReminderEngine';
import { SavingEngine } from '../engines/SavingEngine';
import { NotificationEngine } from '../engines/NotificationEngine';
import { AnalyticsEngine } from '../engines/AnalyticsEngine';
import { aiEngine } from '../engines/AIEngine';
import { formatCurrency, formatDate, getCurrentMonthYear } from '../utils/helpers';
import type { User } from '../types';

export class TelegramBot {
  private bot: Telegraf;
  private db: DatabaseManager;
  private authService: AuthService;
  private contextService: ContextService;
  private expenseEngine: ExpenseEngine;
  private incomeEngine: IncomeEngine;
  private budgetEngine: BudgetEngine;
  private debtEngine: DebtEngine;
  private reminderEngine: ReminderEngine;
  private savingEngine: SavingEngine;
  private notificationEngine: NotificationEngine;
  private analyticsEngine: AnalyticsEngine;

  constructor(db: DatabaseManager) {
    this.bot = new Telegraf(config.telegram.botToken);
    this.db = db;
    this.authService = new AuthService(db);
    this.contextService = new ContextService(db);
    this.expenseEngine = new ExpenseEngine(db);
    this.incomeEngine = new IncomeEngine(db);
    this.budgetEngine = new BudgetEngine(db);
    this.debtEngine = new DebtEngine(db);
    this.reminderEngine = new ReminderEngine(db);
    this.savingEngine = new SavingEngine(db);
    this.notificationEngine = new NotificationEngine(db);
    this.analyticsEngine = new AnalyticsEngine(db);
  }

  private getUserByCtx(ctx: Context): User | null {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return null;
    return this.authService.getUserByTelegramId(telegramId);
  }

  private async requireAuth(ctx: Context): Promise<User | null> {
    const user = this.getUserByCtx(ctx);
    if (!user) {
      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) return null;
      const token = await this.authService.createRegistrationToken(telegramId);
      const regUrl = `${config.server.frontendUrl}/register?token=${token.token}`;
      await ctx.reply(
        `👋 Halo! Kamu belum terdaftar di TemanDuit.\n\n` +
        `Klik link berikut untuk mendaftar:\n${regUrl}\n\n` +
        `⏰ Link berlaku 24 jam.`,
        { parse_mode: 'Markdown' },
      );
      return null;
    }
    return user;
  }

  setupHandlers(): void {

    // ---- /start ----
    this.bot.command('start', async (ctx) => {
      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) return;

      const existingUser = this.authService.getUserByTelegramId(telegramId);

      if (existingUser) {
        await ctx.reply(
          `👋 Selamat datang kembali, *${existingUser.name}*!\n\n` +
          `💳 Saldo: ${formatCurrency(existingUser.balance)}\n` +
          `🏦 Tabungan: ${formatCurrency(existingUser.savingBalance)}\n\n` +
          `Ketik pesan apapun untuk mencatat keuanganmu, atau gunakan perintah:\n\n` +
          `/saldo - Lihat saldo\n` +
          `/ringkasan - Ringkasan bulan ini\n` +
          `/hutang - Daftar hutang\n` +
          `/reminder - Daftar reminder\n` +
          `/insight - AI Insight\n` +
          `/akundashboard - Kode login dashboard\n` +
          `/bantuan - Panduan lengkap`,
          { parse_mode: 'Markdown' },
        );
        return;
      }

      const token = await this.authService.createRegistrationToken(telegramId);
      const regUrl = `${config.server.frontendUrl}/register?token=${token.token}`;
      await ctx.reply(
        `👋 Halo! Selamat datang di *TemanDuit* 🤖💰\n\n` +
        `TemanDuit adalah asisten keuangan pribadi berbasis AI:\n` +
        `• 📊 Mencatat pengeluaran & pemasukan\n` +
        `• 💡 Menganalisis kondisi keuangan\n` +
        `• ⏰ Mengingatkan tagihan & hutang\n` +
        `• 📈 Membuat laporan keuangan\n\n` +
        `*Daftar sekarang:*\n${regUrl}\n\n` +
        `⏰ Link berlaku 24 jam.`,
        { parse_mode: 'Markdown' },
      );
    });

    // ---- /saldo ----
    this.bot.command('saldo', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;
      await ctx.reply(
        `💳 *Saldo TemanDuit*\n\n` +
        `💰 Saldo Utama: ${formatCurrency(user.balance)}\n` +
        `🏦 Tabungan: ${formatCurrency(user.savingBalance)}\n` +
        `💎 Total: ${formatCurrency(user.balance + user.savingBalance)}`,
        { parse_mode: 'Markdown' },
      );
    });

    // ---- /ringkasan ----
    this.bot.command('ringkasan', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;

      const { month, year } = getCurrentMonthYear();
      const summary = this.analyticsEngine.getFinancialSummary(user.id, month, year);
      const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

      await ctx.reply(
        `📊 *Ringkasan ${monthNames[month - 1]} ${year}*\n\n` +
        `💰 Pemasukan: ${formatCurrency(summary.totalIncome)}\n` +
        `💸 Pengeluaran: ${formatCurrency(summary.totalExpense)}\n` +
        `📈 Tabungan bersih: ${formatCurrency(summary.netSavings)}\n` +
        `🎯 Saving rate: ${summary.savingRate}%\n\n` +
        `📋 Budget terpakai: ${summary.budgetUsage}%\n` +
        `📅 Avg. harian: ${formatCurrency(summary.averageDailySpending)}\n\n` +
        `🏆 Terbesar: ${summary.mostExpensiveCategory}\n` +
        `🔄 Terbanyak: ${summary.mostFrequentCategory}`,
        { parse_mode: 'Markdown' },
      );
    });

    // ---- /hutang ----
    this.bot.command('hutang', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;

      const debts = this.debtEngine.getDebts(user.id)
        .filter((d) => d.status !== 'PAID' && d.status !== 'CANCELLED');

      if (debts.length === 0) {
        await ctx.reply('✅ Tidak ada hutang aktif. Hebat!', { parse_mode: 'Markdown' });
        return;
      }

      let msg = `📋 *Daftar Hutang & Piutang*\n\n`;
      for (const debt of debts.slice(0, 10)) {
        const statusEmoji: Record<string, string> = {
          ACTIVE: '🟡', PARTIAL: '🟠', OVERDUE: '🔴', PAID: '✅', CANCELLED: '⚫',
        };
        msg += `${statusEmoji[debt.status] ?? '⚪'} *${debt.counterpartyName}*\n`;
        msg += `   Sisa: ${formatCurrency(debt.remainingAmount)}\n`;
        if (debt.dueDate) {
          msg += `   Jatuh tempo: ${formatDate(debt.dueDate, user.timezone)}\n`;
        }
        msg += '\n';
      }
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    // ---- /reminder ----
    this.bot.command('reminder', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;

      const reminders = this.reminderEngine.getUpcomingReminders(user.id, 30);

      if (reminders.length === 0) {
        await ctx.reply('📭 Tidak ada reminder yang akan datang.', { parse_mode: 'Markdown' });
        return;
      }

      let msg = `⏰ *Reminder Mendatang*\n\n`;
      for (const rem of reminders.slice(0, 5)) {
        msg += this.reminderEngine.formatReminderForTelegram(rem, user.timezone);
        msg += '\n\n';
      }
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    });

    // ---- /insight ----
    this.bot.command('insight', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;

      await ctx.reply('🤔 Sedang menganalisis keuanganmu...', { parse_mode: 'Markdown' });

      try {
        const context = this.contextService.buildAIContext(user.id);
        const insight = await aiEngine.generateInsight(context);

        let msg = `💡 *${insight.title}*\n\n${insight.content}\n\n`;
        if (insight.recommendations.length > 0) {
          msg += `*✨ Rekomendasi:*\n`;
          insight.recommendations.forEach((rec, i) => {
            msg += `${i + 1}. ${rec}\n`;
          });
        }
        await ctx.reply(msg, { parse_mode: 'Markdown' });
      } catch {
        await ctx.reply('Maaf, insight tidak tersedia saat ini. 🙏');
      }
    });

    // ---- /tabung ----
    this.bot.command('tabung', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;

      const parts = (ctx.message as { text: string }).text.split(' ').slice(1);
      if (parts.length < 2) {
        await ctx.reply('Format: /tabung [nominal] [keterangan]\nContoh: /tabung 500000 dana darurat');
        return;
      }

      const amount = parseFloat(parts[0]);
      const description = parts.slice(1).join(' ');

      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('❌ Nominal tidak valid');
        return;
      }

      try {
        await this.savingEngine.recordSaving(user.id, {
          action: 'saving', type: 'deposit', amount, description,
        });
        const updatedUser = this.authService.getUserById(user.id)!;
        await ctx.reply(
          `🏦 *Berhasil Menabung!*\n\n` +
          `💰 ${formatCurrency(amount)}\n` +
          `📝 ${description}\n` +
          `🏦 Total tabungan: ${formatCurrency(updatedUser.savingBalance)}`,
          { parse_mode: 'Markdown' },
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
        await ctx.reply(`❌ ${msg}`);
      }
    });

    // ---- /akundashboard ----
    this.bot.command('akundashboard', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;

      try {
        const newCode = await this.authService.regenerateLoginCode(user.id);
        const loginUrl = `${config.server.frontendUrl}/activeUserLogin`;

        await ctx.reply(
          `🔑 *Kode Login Dashboard TemanDuit*\n\n` +
          `Gunakan kode berikut untuk login:\n\n` +
          `\`${newCode}\`\n\n` +
          `*Cara login:*\n` +
          `1. Buka: ${loginUrl}\n` +
          `2. Masukkan kode di atas\n` +
          `3. Klik Login\n\n` +
          `⚠️ *Simpan kode ini dengan aman.*\n` +
          `Kode lama sudah tidak aktif.\n` +
          `Ketik /akundashboard kapan saja untuk kode baru.`,
          { parse_mode: 'Markdown' },
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
        await ctx.reply(`❌ ${msg}`);
      }
    });

    // ---- /bantuan ----
    this.bot.command('bantuan', async (ctx) => {
      await ctx.reply(
        `🤖 *Panduan TemanDuit*\n\n` +
        `*Catat Pengeluaran:*\n` +
        `• "beli bakso 15 ribu"\n` +
        `• "isi bensin 50rb"\n` +
        `• "bayar listrik 200k"\n\n` +
        `*Catat Pemasukan:*\n` +
        `• "gajian 5 juta"\n` +
        `• "dapat bonus 1 juta"\n\n` +
        `*Hutang/Piutang:*\n` +
        `• "hutang ke budi 100k"\n` +
        `• "piutang dari andi 50rb"\n\n` +
        `*Tanya AI:*\n` +
        `• "bulan ini aku boros gak?"\n` +
        `• "saldo cukup sampai gajian?"\n\n` +
        `*Perintah:*\n` +
        `/saldo - Lihat saldo\n` +
        `/ringkasan - Ringkasan bulan ini\n` +
        `/hutang - Daftar hutang\n` +
        `/reminder - Daftar reminder\n` +
        `/insight - AI insight keuangan\n` +
        `/tabung [nominal] [ket] - Menabung\n` +
        `/akundashboard - Kode login dashboard\n\n` +
        `📊 Dashboard: ${config.server.frontendUrl}`,
        { parse_mode: 'Markdown' },
      );
    });

    // ---- Handle semua pesan teks (natural language) ----
    this.bot.on('text', async (ctx) => {
      const user = await this.requireAuth(ctx);
      if (!user) return;

      const text = (ctx.message as { text: string }).text;
      if (text.startsWith('/')) return;

      try {
        await ctx.sendChatAction('typing');
        const parsed = await aiEngine.parseUserMessage(text);
        logger.debug('[Bot] AI parsed', { action: parsed.action, userId: user.id });

        switch (parsed.action) {
          case 'expense': {
            const tx = await this.expenseEngine.recordExpense(user.id, parsed, text);
            const updated = this.authService.getUserById(user.id)!;
            await this.notificationEngine.notifyLargeExpense(user.id, parsed.amount, parsed.description, tx.id);
            await this.notificationEngine.checkBudgetWarnings(user.id);
            const reply = await aiEngine.formatTransactionReply('expense', parsed.amount, parsed.description, updated.balance);
            await ctx.reply(reply, { parse_mode: 'Markdown' });
            break;
          }

          case 'income': {
            await this.incomeEngine.recordIncome(user.id, parsed, text);
            const updated = this.authService.getUserById(user.id)!;
            const reply = await aiEngine.formatTransactionReply('income', parsed.amount, parsed.description, updated.balance);
            await ctx.reply(reply, { parse_mode: 'Markdown' });
            break;
          }

          case 'debt':
          case 'receivable':
          case 'installment': {
            const debt = await this.debtEngine.createDebt(user.id, parsed);
            await ctx.reply(
              `📋 *Hutang Tercatat!*\n\n` +
              `👤 ${debt.counterpartyName}\n` +
              `💵 ${formatCurrency(debt.amount)}\n` +
              `📝 ${debt.description}\n` +
              (debt.dueDate ? `📅 Jatuh tempo: ${formatDate(debt.dueDate, user.timezone)}\n` : ''),
              { parse_mode: 'Markdown' },
            );
            break;
          }

          case 'saving': {
            await this.savingEngine.recordSaving(user.id, parsed);
            const updated = this.authService.getUserById(user.id)!;
            const typeLabel = parsed.type === 'deposit' ? 'Tabung' : 'Tarik Tabungan';
            await ctx.reply(
              `🏦 *${typeLabel} Berhasil!*\n\n` +
              `💰 ${formatCurrency(parsed.amount)}\n` +
              `📝 ${parsed.description}\n` +
              `🏦 Total tabungan: ${formatCurrency(updated.savingBalance)}\n` +
              `💳 Saldo: ${formatCurrency(updated.balance)}`,
              { parse_mode: 'Markdown' },
            );
            break;
          }

          case 'reminder': {
            const reminder = await this.reminderEngine.createReminder(user.id, parsed);
            await ctx.reply(
              `⏰ *Reminder Dibuat!*\n\n` +
              this.reminderEngine.formatReminderForTelegram(reminder, user.timezone),
              { parse_mode: 'Markdown' },
            );
            break;
          }

          case 'question': {
            await ctx.sendChatAction('typing');
            const context = this.contextService.buildAIContext(user.id);
            const answer = await aiEngine.answerQuestion(parsed.question, context);
            await ctx.reply(`🤖 ${answer}`, { parse_mode: 'Markdown' });
            break;
          }

          default:
            await ctx.reply('Maaf, saya tidak mengerti. Ketik /bantuan untuk panduan.', { parse_mode: 'Markdown' });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
        logger.error('[Bot] Handler error', { error: msg, userId: user.id });
        await ctx.reply(`❌ ${msg}\n\nCoba lagi atau ketik /bantuan.`);
      }
    });

    this.bot.catch((err, ctx) => {
      logger.error('[Bot] Global error', { error: err, updateType: ctx.updateType });
    });
  }

  // ---- Public methods ----

  async sendNotification(telegramId: string, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    } catch (err) {
      logger.error('[Bot] sendNotification error', { error: err, telegramId });
    }
  }

  async sendLoginCodeAfterRegister(telegramId: string, userName: string, loginCode: string): Promise<void> {
    const loginUrl = `${config.server.frontendUrl}/activeUserLogin`;
    try {
      await this.bot.telegram.sendMessage(
        telegramId,
        `🎉 *Registrasi TemanDuit Berhasil!*\n\n` +
        `Halo *${userName}*, akun kamu sudah aktif!\n\n` +
        `🔑 *Kode Login Dashboard:*\n` +
        `\`${loginCode}\`\n\n` +
        `*Cara login ke dashboard:*\n` +
        `1. Buka: ${loginUrl}\n` +
        `2. Masukkan kode di atas\n` +
        `3. Klik Login\n\n` +
        `⚠️ Simpan kode ini baik-baik!\n` +
        `Jika lupa, ketik /akundashboard untuk kode baru.`,
        { parse_mode: 'Markdown' },
      );
    } catch (err) {
      logger.error('[Bot] sendLoginCodeAfterRegister error', { error: err, telegramId });
    }
  }

  async start(): Promise<void> {
    if (!config.telegram.botToken) {
      logger.warn('[Bot] TELEGRAM_BOT_TOKEN not set - bot disabled');
      return;
    }

    this.setupHandlers();

    if (config.telegram.webhookUrl) {
      await this.bot.telegram.setWebhook(`${config.telegram.webhookUrl}/bot${config.telegram.botToken}`);
      logger.info('[Bot] Webhook set', { url: config.telegram.webhookUrl });
    } else {
      this.bot.launch({ dropPendingUpdates: true });
      logger.info('[Bot] Polling started');
    }
  }

  stop(): void {
    this.bot.stop('SIGINT');
  }

  getMiddleware() {
    return this.bot.webhookCallback(`/bot${config.telegram.botToken}`);
  }
}
