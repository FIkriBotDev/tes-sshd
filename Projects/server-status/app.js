// app.js
const { ifError } = require("assert");
const express = require("express");
const app = express();

const PORT = 1122;
const TARGET_BASE = "https://stats.uptimerobot.com/qFxMhDzOcu";

// redirect otomatis (0 detik)
app.get("/", (req, res) => {
    const targetUrl = `${TARGET_BASE}`;
    return res.redirect(302, targetUrl);
});

app.listen(PORT, () => {
    console.log(`Redirect server running on http://localhost:${PORT}`);
});
