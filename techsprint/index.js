const { ifError } = require("assert");
const express = require("express");
const app = express();
const url = "https://techsprint.exodusai.biz.id";

const PORT = 5526;
const TARGET_BASE = `${url}/jadikelas/index.html`;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/jadikelas/index.html");
});

app.get("/about", (req, res) => {
    res.sendFile(__dirname + "/jadikelas/about/index.html");
});

app.get("/index.html", (req, res) => {
    res.sendFile(__dirname + "/jadikelas/index.html");
});

app.listen(PORT, () => {
    console.log(`Server running on https://techsprint.exodusai.biz.id/`);
});
