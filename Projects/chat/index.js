// app.js
const { ifError } = require("assert");
const express = require("express");
const app = express();

const PORT = 1124;
const TARGET_BASE = "https://wa.me/6285150984232?text=Hai";

// redirect otomatis (0 detik)
app.get("/", (req, res) => {
    const targetUrl = `${TARGET_BASE}`;
    return res.redirect(302, targetUrl);
});

app.listen(PORT, () => {
    console.log(`Redirect server running on http://localhost:${PORT}`);
});
