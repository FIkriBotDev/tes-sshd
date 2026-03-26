import TelegramBot from "node-telegram-bot-api";
import { config } from "./config/config.js";

import startCommand from "./commands/start.js";
import tamparCommand from "./commands/tampar.js";

import { generateAI } from "./services/ai.js";
import { startScheduler } from "./services/scheduler.js";
import { saveChatLog } from "./utils/logger.js";

const bot = new TelegramBot(config.telegramToken, { polling: true });

// COMMANDS
startCommand(bot);
tamparCommand(bot);

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/")) return;

/*  const response = await generateAI(text);
  await bot.sendMessage(chatId, response);
*/

  let typing = true;

  // loop typing
  const typingInterval = setInterval(() => {
    if (typing) {
      bot.sendChatAction(chatId, "typing");
    }
  }, 4000); // kirim tiap 4 detik

  try {
    const response = await generateAI(text);

    typing = false;
    clearInterval(typingInterval);

    await bot.sendMessage(chatId, response);
  }

  // 🔥 SIMPAN LOG
  saveChatLog(chatId, text, response);
});

// START SCHEDULER
startScheduler(bot);

console.log("🚀 Bot jalan...");
