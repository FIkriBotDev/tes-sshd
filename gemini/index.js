const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const port = 8009;

app.use(cors());

// Log error ke file
const originalConsoleError = console.error;
console.error = function (...args) {
    const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ');
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync('error_log.txt', logEntry);
    originalConsoleError.apply(console, args);
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

app.get("/api/ytsummarize", async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: "URL video tidak boleh kosong" });
    }

    try {
        const result = await model.generateContent([
            `Ringkas video ini dengan format berikut:

            [Ringkasan Video]
            <Deskripsi umum tentang isi video>

            [Timeline]
            00:00:05 - <Deskripsi peristiwa pertama>
            00:01:00 - <Deskripsi peristiwa kedua>
            00:02:30 - <Deskripsi peristiwa berikutnya>`
        ]);

        const responseText = result.response.text().trim();
        const jsonResponse = parseTextToJson(responseText);

        return res.json({ summarize: jsonResponse });

    } catch (error) {
        console.error("Error generating summary:", error);
        return res.status(500).json({ error: "Terjadi kesalahan saat memproses permintaan" });
    }
});

app.get("/api/gemini-image", async (req, res) => {
    const imageUrl = req.query.url;
    const textPrompt = req.query.text || "Jelaskan gambar ini";

    if (!imageUrl) {
        return res.status(400).json({ status: false, error: "URL gambar tidak boleh kosong" });
    }

    try {
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();

        const result = await model.generateContent([
            {
                inlineData: {
                    data: Buffer.from(imageBuffer).toString("base64"),
                    mimeType: "image/jpeg",
                },
            },
            textPrompt,
        ]);

        const responseText = result.response.text().trim();

        return res.json({
            creator: "@Fikri",
            status: true,
            result: responseText,
        });
    } catch (error) {
        console.error("Error processing image:", error);
        return res.status(500).json({ status: false, error: "Terjadi kesalahan saat memproses gambar" });
    }
});

function parseTextToJson(responseText) {
    const lines = responseText.split("\n").map(line => line.trim()).filter(line => line);
    let summary = "";
    let timeline = [];
    let isTimeline = false;

    for (const line of lines) {
        if (line.startsWith("[Timeline]")) {
            isTimeline = true;
            continue;
        }

        if (!isTimeline) {
            summary += (summary ? " " : "") + line;
        } else {
            const match = line.match(/^(\d{2}:\d{2}:\d{2})\s*-\s*(.+)$/);
            if (match) {
                timeline.push({ timestamp: match[1], description: match[2] });
            }
        }
    }

    return { summary, timeline };
}

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
