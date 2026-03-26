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

  let typing = true;
  let response = ""; // 🔥 pindahin ke sini

  const typingInterval = setInterval(() => {
    if (typing) {
      bot.sendChatAction(chatId, "typing");
    }
  }, 4000);

  try {
    response = await generateAI(text); // ✅ isi variabel luar

    typing = false;
    clearInterval(typingInterval);

    await bot.sendMessage(chatId, response);
  } catch (err) {
    typing = false;
    clearInterval(typingInterval);

    response = "Error."; // 🔥 biar tetap ke-log

    await bot.sendMessage(chatId, response);
  }

  // 🔥 sekarang aman
  saveChatLog(chatId, text, response);
});

// START SCHEDULER
startScheduler(bot);

console.log("🚀 Bot jalan...");
