import fs from "fs-extra";

const DB_PATH = "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/data.json";

export async function getUsers() {
  try {
    return await fs.readJSON(DB_PATH);
  } catch {
    return [];
  }
}

export async function saveUser(user) {
  const users = await getUsers();

  if (!users.find(u => u.id === user.id)) {
    users.push(user);
    await fs.writeJSON(DB_PATH, users, { spaces: 2 });
  }
}
