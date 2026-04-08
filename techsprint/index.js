const { ifError } = require("assert");
const express = require("express");
const app = express();
const url = "https://techsprint.exodusai.biz.id";

const PORT = 5526;
const TARGET_BASE = `${url}/jadikelas/index.html`;

app.get("/", (req, res) => {
    const targetUrl = `${TARGET_BASE}`;
    return res.redirect(302, targetUrl);
});

app.get("/jadikelas/index.html", (req, res) => {
    res.sendFile(__dirname + "/jadikelas/index.html");
});

app.get("/jadikelas/about", (req, res) => {
    res.sendFile(__dirname + "/jadikelas/index.html");
});

app.listen(PORT, () => {
    console.log(`Server running on https://techsprint.exodusai.biz.id/`);
});
