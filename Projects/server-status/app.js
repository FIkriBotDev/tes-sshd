// app.js
const { ifError } = require("assert");
const express = require("express");
const app = express();

const PORT = 1122;
const TARGET_BASE = "https://stats.uptimerobot.com/qFxMhDzOcu";

// redirect otomatis (0 detik)
app.get("/:kode", (req, res) => {
    const { kode } = req.params;
    const targetUrl = `${TARGET_BASE}/${kode}`;
    return res.redirect(302, targetUrl);
});

app.listen(PORT, () => {
    console.log(`Redirect server running on http://localhost:${PORT}`);
});
