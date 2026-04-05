const fs = require("fs");

// Ambil command dari terminal
const command = process.argv[2];
const input = process.argv.slice(3).join(" ");

const file = "to-do_list.txt";

// Pastikan file ada
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, "");
}

// 🔹 Ambil semua data
function getTodos() {
  const data = fs.readFileSync(file, "utf-8");
  return data.split("\n").filter(todo => todo !== "");
}

// 🔹 Simpan data
function saveTodos(todos) {
  fs.writeFileSync(file, todos.join("\n"));
}

// 🔹 ADD
if (command === "add") {
  if (!input) {
    console.log("❌ Masukkan tugas!");
    process.exit();
  }

  const todos = getTodos();
  todos.push(input);
  saveTodos(todos);

  console.log("✅ Tugas ditambahkan!");
}

// 🔹 LIST
else if (command === "list") {
  const todos = getTodos();

  if (todos.length === 0) {
    console.log("📭 Tidak ada tugas.");
    return;
  }

  console.log("📋 Daftar To-Do:");
  todos.forEach((todo, index) => {
    console.log(`${index + 1}. ${todo}`);
  });
}

// 🔹 DELETE
else if (command === "delete") {
  const index = parseInt(process.argv[3]);

  if (isNaN(index)) {
    console.log("❌ Masukkan nomor tugas yang valid!");
    return;
  }

  const todos = getTodos();

  if (index < 1 || index > todos.length) {
    console.log("❌ Nomor tidak ditemukan!");
    return;
  }

  const deleted = todos.splice(index - 1, 1);
  saveTodos(todos);

  console.log(`🗑️ Tugas dihapus: ${deleted}`);
}

// 🔹 COMMAND TIDAK DIKENAL
else {
  console.log(`
Gunakan perintah:
node app.js add "Tugas baru"
node app.js list
node app.js delete 1
`);
}