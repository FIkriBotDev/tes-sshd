import cron from "node-cron";
import fs from "fs";
import { getUsers } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/services/db.js";
import { generateWakeUp } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/services/ai.js";

export function startScheduler(bot) {
  //cron.schedule("0 5 * * *", async () => {
  cron.schedule("20 18 * * *", async () => {

    console.log("⏰ Sending daily tamparan...");

    const users = await getUsers();

    for (const user of users) {
      try {
        const text = await generateWakeUp(user.goal || "jadi sukses");

        await bot.sendMessage(user.id, text);
       // await bot.sendAudio(user.id, fs.createReadStream("/home/runner/work/tes-sshd/tes-sshd/alarm.mp3"));
       await bot.sendAudio(
          user.id,
          fs.createReadStream("/home/runner/work/tes-sshd/tes-sshd/Projects/upload/tmp/alarm.mp3"),
          {},
          {
            filename: "alarm.mp3",
            contentType: "audio/mpeg"
          }
        );

      } catch (err) {
        console.log("Error kirim ke user:", user.id);
      }
    }

  }, {
    timezone: "Asia/Jakarta"
  });
}
