import fs from "fs";

const LOG_FILE = "./log_tiboty.txt";

export function saveChatLog(userId, userMessage, aiResponse) {
  const log = `
id: ${userId}
user: ${userMessage}
ai: ${aiResponse}
----------------------------------------
`;

  fs.appendFile(LOG_FILE, log, (err) => {
    if (err) console.error("Error save log:", err);
  });
}
