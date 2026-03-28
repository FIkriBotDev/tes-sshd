import TelegramBot from "node-telegram-bot-api";
import { config } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/config/config.js";

import startCommand from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/commands/start.js";
import tamparCommand from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/commands/tampar.js";

import { generateAIStream } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/services/ai.js";
import { startScheduler } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/services/scheduler.js";
import { saveChatLog } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/utils/logger.js";

import { getUserMessages, addMessage } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/services/memory.js";
import { brutalSystemPrompt } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/prompts/brutalPrompt.js";

const bot = new TelegramBot(config.telegramToken, { polling: true });

// COMMANDS
startCommand(bot);
tamparCommand(bot);

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/")) return;

  let typing = true;
  let response = "";

  const typingInterval = setInterval(() => {
    if (typing) {
      bot.sendChatAction(chatId, "typing");
    }
  }, 4000);

  try {
    const history = getUserMessages(chatId);

    // simpan user message
    addMessage(chatId, "user", text);

    const messages = [
      { role: "system", content: brutalSystemPrompt },
      ...history
    ];

    // kirim placeholder
    const sentMsg = await bot.sendMessage(chatId, "💬 ...");

    let lastEdit = Date.now();

    response = await generateAIStream(messages, async (chunkText) => {
      // throttle biar gak kena limit telegram
      if (Date.now() - lastEdit < 1000) return;
      lastEdit = Date.now();

      try {
        await bot.editMessageText(chunkText || "...", {
          chat_id: chatId,
          message_id: sentMsg.message_id
        });
      } catch (err) {}
    });

    typing = false;
    clearInterval(typingInterval);

    // simpan jawaban AI ke memory
    addMessage(chatId, "assistant", response);

    // final update (biar full text masuk)
    await bot.editMessageText(response, {
      chat_id: chatId,
      message_id: sentMsg.message_id
    });

  } catch (err) {
    typing = false;
    clearInterval(typingInterval);

    response = "Error.";

    await bot.sendMessage(chatId, response);
  }

  saveChatLog(chatId, text, response);
});

// START SCHEDULER
startScheduler(bot);

console.log("🚀 Bot jalan...");