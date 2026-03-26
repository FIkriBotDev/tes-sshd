import cron from "node-cron";
import fs from "fs";
import { getUsers } from "./db.js";
import { generateWakeUp } from "./ai.js";

export function startScheduler(bot) {
  cron.schedule("0 5 * * *", async () => {
    console.log("⏰ Sending daily tamparan...");

    const users = await getUsers();

    for (const user of users) {
      try {
        const text = await generateWakeUp(user.goal || "jadi sukses");

        await bot.sendMessage(user.id, text);
        await bot.sendAudio(user.id, fs.createReadStream("/home/runner/work/tes-sshd/tes-sshd/alarm.mp3"));

      } catch (err) {
        console.log("Error kirim ke user:", user.id);
      }
    }

  }, {
    timezone: "Asia/Jakarta"
  });
}
