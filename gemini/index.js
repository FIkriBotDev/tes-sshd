const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
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

// Endpoint YouTube Summary (masih pakai Gemini)
const { GoogleGenerativeAI } = require("@google/generative-ai");
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

// Endpoint /api/gemini-image (gunakan Pollinations + logging ke gemini_log.txt)
app.get("/api/gemini-image", async (req, res) => {
    const imageUrl = req.query.url;
    const textPrompt = req.query.text || "Jelaskan gambar ini";

    if (!imageUrl) {
        return res.status(400).json({ status: false, error: "URL gambar tidak boleh kosong" });
    }

    try {
        const pollinationsRes = await fetch("https://text.pollinations.ai/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "openai",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: textPrompt },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 300
            })
        });

        const rawResponse = await pollinationsRes.text();

        let data;
        try {
            data = JSON.parse(rawResponse);
        } catch (e) {
            fs.appendFileSync("error_gemini_web.txt", `[${new Date().toISOString()}] RAW Response (parse error):\n${rawResponse}\n\n`);
            throw new Error("Pollinations API tidak mengembalikan JSON");
        }

        if (!data.choices || !data.choices[0]?.message?.content) {
            fs.appendFileSync("error_gemini_web.txt", `[${new Date().toISOString()}] Invalid structure:\n${rawResponse}\n\n`);
            throw new Error("Respons tidak valid dari Pollinations API");
        }

        const responseText = data.choices[0].message.content.trim();

        // Log request dan hasil ke gemini_log.txt
        const logEntry = `
[${new Date().toISOString()}]
Prompt    : ${textPrompt}
Image URL : ${imageUrl}
Response  : ${responseText}

`;
        fs.appendFileSync("gemini_log.txt", logEntry);

        return res.json({
            creator: "@Fikri",
            status: true,
            result: responseText
        });

    } catch (error) {
        console.error("Error processing image:", error);
        return res.status(500).json({ status: false, error: "Terjadi kesalahan saat memproses gambar" });
    }
});

// Fungsi parse YouTube summary
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
