const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "8655574951:AAFeQNQY2n-Bz7DyvkJZcfhFmkq34rNwGmA";
const OWNER_ID = 8084800390;

const bot = new TelegramBot(TOKEN, { polling: true });

// state sementara
let pendingReply = {};

// =======================
// START
// =======================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (chatId === OWNER_ID) {
    bot.sendMessage(chatId, "Halo! kamu adalah owner saya");
  } else {
    bot.sendMessage(chatId, "Halo!");
  }
});

// =======================
// REPLY TEXT (TETAP ADA)
// =======================
bot.onText(/\/reply (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (chatId !== OWNER_ID) {
    return bot.sendMessage(chatId, "Lu bukan owner.");
  }

  const args = match[1].split(" ");
  const targetId = args.shift();
  const text = args.join(" ");

  if (!targetId || !text) {
    return bot.sendMessage(chatId, "Format salah. Contoh:\n/reply USER_ID pesan");
  }

  try {
    await bot.sendMessage(targetId, text);
    bot.sendMessage(chatId, "Pesan terkirim✔️");
  } catch (err) {
    bot.sendMessage(chatId, "Gagal kirim.");
    console.log(err);
  }
});

// =======================
// COMMAND MEDIA OWNER
// =======================
bot.onText(/\/reply-foto (.+)/, (msg, match) => {
  if (msg.chat.id !== OWNER_ID) return;

  pendingReply[OWNER_ID] = {
    type: "photo",
    targetId: match[1],
  };

  bot.sendMessage(OWNER_ID, "Silahkan kirim fotonya (1 foto saja)");
});

bot.onText(/\/reply-video (.+)/, (msg, match) => {
  if (msg.chat.id !== OWNER_ID) return;

  pendingReply[OWNER_ID] = {
    type: "video",
    targetId: match[1],
  };

  bot.sendMessage(OWNER_ID, "Silahkan kirim videonya");
});

bot.onText(/\/reply-audio (.+)/, (msg, match) => {
  if (msg.chat.id !== OWNER_ID) return;

  pendingReply[OWNER_ID] = {
    type: "audio",
    targetId: match[1],
  };

  

  bot.sendMessage(OWNER_ID, "Silahkan kirim audionya");
});

bot.onText(/\/reply-file (.+)/, (msg, match) => {
  if (msg.chat.id !== OWNER_ID) return;

  pendingReply[OWNER_ID] = {
    type: "document",
    targetId: match[1],
  };

  bot.sendMessage(OWNER_ID, "Silahkan kirim filenya");
});

// =======================
// HANDLE SEMUA MESSAGE
// =======================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // skip command
  if (msg.text && msg.text.startsWith("/")) return;

  // =======================
  // OWNER MODE (KIRIM MEDIA)
  // =======================
  if (chatId === OWNER_ID && pendingReply[OWNER_ID]) {
    const { type, targetId } = pendingReply[OWNER_ID];

    try {
      if (type === "photo" && msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        await bot.sendPhoto(targetId, fileId, {
          caption: msg.caption || "",
        });
      }

      else if (type === "video" && msg.video) {
        await bot.sendVideo(targetId, msg.video.file_id, {
          caption: msg.caption || "",
        });
      }

      else if (type === "audio" && msg.audio) {
        await bot.sendAudio(targetId, msg.audio.file_id);
      }

      else if (type === "voice" && msg.voice) {
        await bot.sendVoice(targetId, msg.voice.file_id);
      }

      else if (type === "document" && msg.document) {
        await bot.sendDocument(targetId, msg.document.file_id, {
          caption: msg.caption || "",
        });
      }

      else {
        return bot.sendMessage(chatId, "Tipe tidak sesuai. Ulangi command.");
      }

      bot.sendMessage(chatId, "Pesan terkirim✔️");
      delete pendingReply[OWNER_ID];

    } catch (err) {
      bot.sendMessage(chatId, "Gagal kirim.");
      console.log(err);
    }

    return;
  }

  // =======================
  // USER → OWNER
  // =======================
  if (chatId !== OWNER_ID) {
    const username = msg.from.username
      ? "@" + msg.from.username
      : msg.from.first_name;

    const header = `Pesan dari ${username} [${chatId}]`;

    try {
      if (msg.text) {
        await bot.sendMessage(OWNER_ID, `${header}\n\n${msg.text}`);
      }

      else if (msg.photo) {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        await bot.sendPhoto(OWNER_ID, fileId, {
          caption: `${header}\n\n${msg.caption || ""}`
        });
      }

      else if (msg.video) {
        await bot.sendVideo(OWNER_ID, msg.video.file_id, {
          caption: `${header}\n\n${msg.caption || ""}`
        });
      }

      else if (msg.audio) {
        await bot.sendAudio(OWNER_ID, msg.audio.file_id, {
          caption: header
        });
      }

      else if (msg.document) {
        await bot.sendDocument(OWNER_ID, msg.document.file_id, {
          caption: header
        });
      }

            // ✅ VN dari user
      else if (msg.voice) {
        await bot.sendVoice(OWNER_ID, msg.voice.file_id, {
          caption: `🎤 ${header}`
        });
      }

    } catch (err) {
      console.log(err);
    }
  }
});