import { saveUser } from "../services/db.js";

export default function startCommand(bot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    await saveUser({
      id: chatId,
      goal: "jadi sukses"
    });

    bot.sendMessage(chatId, `
Langsung aja ya, gua bukan customer service yang basa-basi.
Lu ke sini mau ngapain? Mau kaya, mau keluar dari hidup medioker, atau cuma mau buang waktu?

Kalau cuma mau ngobrol kosong, capek gua.
Kalau mau naik level, kita mulai.
    `);
  });
}
