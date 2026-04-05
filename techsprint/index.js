const { ifError } = require("assert");
const express = require("express");
const app = express();

const PORT = 5526;
const TARGET_BASE = "https://uploader.exodusai.biz.id/tmp/ok.html";

app.get("/", (req, res) => {
    const targetUrl = `${TARGET_BASE}`;
    return res.redirect(302, targetUrl);
});

app.listen(PORT, () => {
    console.log(`Redirect server running on http://localhost:${PORT}`);
});
