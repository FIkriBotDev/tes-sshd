import { generateAI } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/services/ai.js";

export default function tamparCommand(bot) {
  bot.onText(/\/tampar/, async (msg) => {
    const chatId = msg.chat.id;

    const result = await generateAI("Kasih tamparan finansial brutal random");

    bot.sendMessage(chatId, result);
  });
}
