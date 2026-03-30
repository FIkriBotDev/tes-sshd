const TelegramBot = require("node-telegram-bot-api");

// Ganti dengan token bot lu
const TOKEN = "TOKEN_BOT_LO";

// Ganti dengan user ID telegram lu
const OWNER_ID = 123456789;

const bot = new TelegramBot(TOKEN, { polling: true });

// /start handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId === OWNER_ID) {
    bot.sendMessage(chatId, "Halo! kamu adalah owner saya");
  } else {
    bot.sendMessage(chatId, "Halo! silahkan chat fikri dari sini.");
  }
});

// Handler semua pesan
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // skip command
  if (msg.text && msg.text.startsWith("/")) return;

  // kalau dari user (bukan owner)
  if (chatId !== OWNER_ID) {
    const username = msg.from.username
      ? "@" + msg.from.username
      : msg.from.first_name;

    const text = msg.text || "[non-text message]";

    const forwardText = `Pesan dari ${username} [${chatId}]\n\n${text}`;

    bot.sendMessage(OWNER_ID, forwardText);
  }
});

// Command reply
bot.onText(/\/reply (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (chatId !== OWNER_ID) {
    return bot.sendMessage(chatId, "Lu bukan owner.");
  }

  const args = match[1].split(" ");
  const targetId = args.shift();
  const message = args.join(" ");

  if (!targetId || !message) {
    return bot.sendMessage(chatId, "Format salah. Contoh:\n/reply USER_ID pesan");
  }

  bot.sendMessage(targetId, message)
    .then(() => {
      bot.sendMessage(chatId, "Pesan terkirim✔️");
    })
    .catch(() => {
      bot.sendMessage(chatId, "Gagal kirim pesan.");
    });
});