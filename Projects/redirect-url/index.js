// app.js
const { ifError } = require("assert");
const express = require("express");
const app = express();

const PORT = 8899;
const TARGET_BASE = "https://vertexaisearch.cloud.google.com/grounding-api-redirect";

// redirect otomatis (0 detik)
app.get("/:kode", (req, res) => {
    const { kode } = req.params;
    const targetUrl = `${TARGET_BASE}/${kode}`;
    return res.redirect(302, targetUrl);
});

app.get("/aptitude", (req, res) => {
    return res.redirect(200, moveTo.)
})

app.listen(PORT, () => {
    console.log(`Redirect server running on http://localhost:${PORT}`);
});
