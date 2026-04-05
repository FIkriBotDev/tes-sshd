const fs = require("fs");

const command = process.agrv[2];
const input = process.agrv.slice(3).join(" ");
const file = "to-do_list.txt";

if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "");
}

function getTodos() {
    const data = fs.re
}