import { saveUser } from "../services/db.js";

export default function startCommand(bot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    await saveUser({
      id: chatId,
      goal: "jadi sukses"
    });

    bot.sendMessage(chatId, `
Selamat datang di Bot Tampar Finansial 🔥

Ketik bebas apa aja:
"Gua gaji 3 juta, mau beli iPhone"

Atau pakai:
/tampar → tamparan random
    `);
  });
}
