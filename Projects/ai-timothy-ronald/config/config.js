import dotenv from "dotenv";
dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  pollinationsKey: process.env.POLLINATIONS_API_KEY
};
