import { exec } from "child_process";
import fs from "fs";
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

  bot.onText(/\/uptime/, async (msg) => {
    const chatIduptime = msg.chat.id;

    try {
      const data = fs.readFileSync("/proc/uptime", "utf-8");
      const seconds = parseFloat(data.split(" ")[0]);

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      bot.sendMessage(chatIduptime, `🖥️ Uptime: ${hours} jam ${minutes} menit`);
    } catch (err) {
      bot.sendMessage(chatIduptime, "Gagal ambil uptime.");
    }
  });
}