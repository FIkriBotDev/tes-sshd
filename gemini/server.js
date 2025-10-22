const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = 8009;

app.use(cors());

// helper: normalisasi berbagai bentuk message.content menjadi string
function normalizeMessageContent(content) {
    if (content == null) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content.map(item => {
            if (item == null) return "";
            if (typeof item === "string") return item;
            if (typeof item === "object") {
                if (typeof item.text === "string") return item.text;
                if (item.type === "image_url" && item.image_url && item.image_url.url)
                    return `[image: ${item.image_url.url}]`;
                if (Array.isArray(item.content)) return normalizeMessageContent(item.content);
                try {
                    return JSON.stringify(item);
                } catch (e) {
                    return String(item);
                }
            }
            return String(item);
        }).join(" ");
    }
    if (typeof content === "object") {
        if (typeof content.text === "string") return content.text;
        if (Array.isArray(content.parts)) return content.parts.join(" ");
        try {
            return JSON.stringify(content);
        } catch (e) {
            return String(content);
        }
    }
    return String(content);
}

// Log error ke file
const originalConsoleError = console.error;
console.error = function (...args) {
    const message = args.map(a => (typeof a === "string" ? a : JSON.stringify(a, null, 2))).join(" ");
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync("error_log.txt", logEntry);
    originalConsoleError.apply(console, args);
};

// ===== Gemini dengan fallback API Key =====

// kumpulan API key dari .env
const GEMINI_KEYS = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5
].filter(Boolean);

// generateContent dengan fallback ke endpoint v1
async function generateWithGemini(contents) {
    let lastError;
    for (let i = 0; i < GEMINI_KEYS.length; i++) {
        const key = GEMINI_KEYS[i];
        try {
            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": key, // ✅ diperbaiki (bukan Authorization Bearer)
                    },
                    body: JSON.stringify({ contents }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`[${response.status}] ${errorText}`);
            }

            const data = await response.json();
            const text =
                data.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ")?.trim() || "";
            return text;
        } catch (err) {
            lastError = err;
            console.error(`Gemini API Key ${i + 1} gagal: ${err.message}`);
            continue;
        }
    }
    throw new Error("Semua Gemini API Key gagal dipakai: " + lastError?.message);
}

// helper: ambil image URL jadi base64 (untuk Gemini Vision)
async function fetchImageAsBase64(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Gagal fetch gambar: ${res.status} ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
}

// Endpoint YouTube Summary (pakai Gemini + fallback key)
app.get("/api/ytsummarize", async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: "URL video tidak boleh kosong" });
    }

    try {
        const responseText = await generateWithGemini([
            {
                role: "user",
                parts: [
                    { text: `Ringkas video ini dengan format berikut:

[Ringkasan Video]
<Deskripsi umum tentang isi video>

[Timeline]
00:00:05 - <Deskripsi peristiwa pertama>
00:01:00 - <Deskripsi peristiwa kedua>
00:02:30 - <Deskripsi peristiwa berikutnya>` }
                ]
            }
        ]);

        const jsonResponse = parseTextToJson(responseText);

        return res.json({ summarize: jsonResponse });
    } catch (error) {
        console.error("Error generating summary:", error);
        return res.status(500).json({ error: "Terjadi kesalahan saat memproses permintaan" });
    }
});

// Endpoint /api/gemini-image (gunakan Pollinations, fallback ke Gemini Vision)
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
                model: "claude-hybridspace",
                messages: [
                    {
                        role: "user",
                        content: `${textPrompt}\n\nGambar: ${imageUrl}`
                    }
                ],
                max_tokens: 500
            })
        });

        const rawResponse = await pollinationsRes.text();

        let data;
        try {
            data = JSON.parse(rawResponse);
        } catch (e) {
            fs.appendFileSync(
                "error_gemini_web.txt",
                `[${new Date().toISOString()}] RAW Response (parse error):\n${rawResponse}\n\n`
            );
            throw new Error("Pollinations API tidak mengembalikan JSON");
        }

        let responseText;
        if (data.error) {
            fs.appendFileSync(
                "error_gemini_web.txt",
                `[${new Date().toISOString()}] API Error:\n${JSON.stringify(data, null, 2)}\n\n`
            );
            throw new Error("Pollinations API mengembalikan error");
        } else if (typeof data === "string") {
            responseText = data.trim();
        } else if (data.choices && data.choices[0]?.message?.content !== undefined) {
            const rawContent = data.choices[0].message.content;
            responseText = normalizeMessageContent(rawContent).trim();
        } else {
            fs.appendFileSync(
                "error_gemini_web.txt",
                `[${new Date().toISOString()}] Invalid structure:\n${JSON.stringify(data, null, 2)}\n\n`
            );
            throw new Error("Respons tidak valid dari Pollinations API");
        }

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
            result: responseText,
            source: "pollinations"
        });
    } catch (error) {
        console.error("Error Pollinations:", error.message);

        // Fallback ke Gemini Vision
        try {
            const base64Img = await fetchImageAsBase64(imageUrl);
            const responseText = await generateWithGemini([
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: "image/jpeg", data: base64Img } },
                        { text: textPrompt }
                    ]
                }
            ]);

            return res.json({
                creator: "@Fikri",
                status: true,
                result: responseText,
                source: "gemini-fallback"
            });
        } catch (err2) {
            console.error("Error fallback Gemini:", err2.message);
            return res.status(500).json({ status: false, error: "Gagal memproses gambar (Pollinations & Gemini error)" });
        }
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
