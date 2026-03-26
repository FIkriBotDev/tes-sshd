import { exec } from "child_process";
import { saveUser } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/services/db.js";

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
bot.onText(/\/send/, async (msg) => {
    const chatIdd = 8084800390;
    bot.sendMessage(chatIdd, 'haloooooooo');
  });

  bot.onText(/\/uptime/, async (msg) => {
    const chatIduptime = msg.chat.id;
  })
}