import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { DatabaseManager } from './database/DatabaseManager';
import { TelegramBot } from './bot/TelegramBot';
import { SchedulerService } from './services/SchedulerService';
import { errorHandler, notFound } from './middlewares/errorHandler';
import router, { setBotInstance } from './routes';

// ============================================================
// TemanDuit Backend Server
// ============================================================

const app = express();
const db = DatabaseManager.getInstance(config.database.path);

// ---- Security Middleware ----
app.use(helmet());
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Terlalu banyak request. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ---- Body Parser ----
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ---- Telegram Bot Setup ----
let telegramBot: TelegramBot | null = null;

if (config.telegram.botToken) {
  telegramBot = new TelegramBot(db);
  telegramBot.setupHandlers();

  // Webhook mode
  if (config.telegram.webhookUrl) {
    app.use(telegramBot.getMiddleware());
  }
}

// ---- API Routes ----
app.use('/api', router);

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ---- Error Handlers ----
app.use(notFound);
app.use(errorHandler);

// ---- Start Server ----
const server = app.listen(config.server.port, async () => {
  logger.info(`✅ TemanDuit Backend running on port ${config.server.port}`);
  logger.info(`🌍 Environment: ${config.server.nodeEnv}`);
  logger.info(`📁 Database: ${config.database.path}`);

  // Start bot polling (if not webhook mode)
  if (telegramBot && !config.telegram.webhookUrl) {
    await telegramBot.start();
    setBotInstance(telegramBot); // expose ke routes/controllers
  } else if (telegramBot && config.telegram.webhookUrl) {
    setBotInstance(telegramBot);
  }

  // Start scheduler
  const schedulerSendFn = telegramBot
    ? (telegramId: string, message: string) => telegramBot!.sendNotification(telegramId, message)
    : undefined;

  const scheduler = new SchedulerService(db, schedulerSendFn);
  scheduler.start();
});

// ---- Graceful Shutdown ----
const shutdown = (signal: string) => {
  logger.info(`[Server] Received ${signal} - shutting down...`);
  telegramBot?.stop();
  server.close(() => {
    logger.info('[Server] HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('[Server] Unhandled rejection', { reason });
  process.exit(1);
});

export default app;
