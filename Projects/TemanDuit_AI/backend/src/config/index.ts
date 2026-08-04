import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'temanduit-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
  },
  pollinations: {
    apiKey: process.env.POLLINATIONS_API_KEY || '',
    baseUrl: process.env.POLLINATIONS_BASE_URL || 'https://text.pollinations.ai/openai',
    model: process.env.POLLINATIONS_MODEL || 'openai',
  },
  database: {
    path: path.resolve(__dirname, '../../../database/database.json'),
  },
  registration: {
    tokenExpiryHours: 24,
  },
};

export default config;
