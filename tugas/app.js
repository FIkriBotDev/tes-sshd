const fs = require("fs");

const command = process.agrv[2];
const input = process.agrv.slice(3).join(" ");
const file = "to-do_list.txt";

if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "");
}

// function untuk mengambil data
function getTodos() {
    const data = fs.readFileSync(file, "utf-8");
    return data.split("\n").filter(todo => todo !== "");
}

// function untuk menyimpan data
function saveTodos() {
    fs.writeFileSync(file, todos.join("\n"));
}

// COMMAND
// add
if (command === "add") {
    if(!input) {
        console.log("Masukkan tugas!");
        process.exit();
    }
    const todos = getTodos();
    todos.push()
}
