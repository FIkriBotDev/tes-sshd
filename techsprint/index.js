const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5526;

app.use(express.json());
app.use(express.static("public"));

// Load system prompt from SYSTEM_PROMPT.md
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, "SYSTEM_PROMPT.md"), "utf-8");

// In-memory session store: { sessionId: [ {role, content}, ... ] }
const sessions = {};

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

// Chat API endpoint
app.post("/api/chat", async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({ error: "sessionId and message are required" });
    }

    // Init session with system prompt if new
    if (!sessions[sessionId]) {
        sessions[sessionId] = [
            { role: "system", content: SYSTEM_PROMPT }
        ];
    }

    const messages = sessions[sessionId];

    // Add user message
    messages.push({ role: "user", content: message });

    try {
        const response = await axios.post(
            "https://text.pollinations.ai/openai",
            {
                model: "openai",
                messages: messages
            },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 30000
            }
        );

        const aiReply = response.data.choices[0].message.content;

        // Save AI reply to memory
        messages.push({ role: "assistant", content: aiReply });

        res.json({ reply: aiReply });
    } catch (err) {
        console.error("Pollinations API error:", err.message);
        res.status(500).json({ error: "Gagal menghubungi AI. Coba lagi ya 😊" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
