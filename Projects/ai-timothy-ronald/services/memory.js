const userMemory = {};

export function getUserMessages(userId) {
  if (!userMemory[userId]) {
    userMemory[userId] = [];
  }
  return userMemory[userId];
}

export function addMessage(userId, role, content) {
  if (!userMemory[userId]) {
    userMemory[userId] = [];
  }

  userMemory[userId].push({ role, content });

  // 🔥 batasi biar gak kepanjangan (max 10 pesan terakhir)
 /* if (userMemory[userId].length > 10) {
    userMemory[userId].shift();
  }*/
}
