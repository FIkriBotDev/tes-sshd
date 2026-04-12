const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5526;

app.use(express.json());
app.use(express.static("/home/runner/work/tes-sshd/tes-sshd/techsprint/public"));

// ⚠️ API KEY (sesuai permintaan kamu)
const POLLINATIONS_API_KEY = "sk_RM9sUErPNlaj7kFenSIMljnIVvAyssUk";

// Load system prompt
const SYSTEM_PROMPT = fs.readFileSync(
    path.join(__dirname, "SYSTEM_PROMPT.md"),
    "utf-8"
);

// In-memory session store
const sessions = {};

// Routes
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/home/runner/work/tes-sshd/tes-sshd/techsprint/public/index.html");
});

app.get("/about", (req, res) => {
    res.sendFile(__dirname + "/home/runner/work/tes-sshd/tes-sshd/techsprint/public/about/index.html");
});

app.get("/pricing", (req, res) => {
    res.sendFile(__dirname + "/home/runner/work/tes-sshd/tes-sshd/techsprint/public/pricing/index.html");
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile(__dirname + "/home/runner/work/tes-sshd/tes-sshd/techsprint/public/favicon.ico");
});

// Chat API
app.post("/api/chat", async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({
            error: "sessionId and message are required"
        });
    }

    // Init session
    if (!sessions[sessionId]) {
        sessions[sessionId] = [
            { role: "system", content: SYSTEM_PROMPT }
        ];
    }

    const messages = sessions[sessionId];

    // Tambahkan pesan user
    messages.push({
        role: "user",
        content: message
    });

    try {
        const response = await axios.post(
            "https://gen.pollinations.ai/v1/chat/completions",
            {
                model: "openai",
                messages: messages
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${POLLINATIONS_API_KEY}`
                },
                timeout: 30000
            }
        );

        const aiReply =
            response.data.choices?.[0]?.message?.content ||
            "Maaf, saya tidak bisa menjawab saat ini.";

        // Simpan ke memory
        messages.push({
            role: "assistant",
            content: aiReply
        });

        return res.json({ reply: aiReply });

    } catch (err) {
        console.error("Pollinations API error:", err.response?.data || err.message);

        return res.status(500).json({
            error: "Gagal menghubungi AI. Coba lagi ya 😊"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});