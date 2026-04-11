const { ifError } = require("assert");
const express = require("express");
const app = express();
const url = "https://techsprint.exodusai.biz.id";

const PORT = 5526;
const TARGET_BASE = `${url}/public/index.html`;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/about", (req, res) => {
    res.sendFile(__dirname + "/public/about/index.html");
});

app.get("/index.html", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/pricing", (req, res) => {
    res.sendFile(__dirname + "/public/pricing/index.html");
});

app.get("/auth", (req, res) => {
    res.sendFile(__dirname + "/public/auth/index.html");
});

app.listen(PORT, () => {
    console.log(`Server running on https://techsprint.exodusai.biz.id/`);
});
