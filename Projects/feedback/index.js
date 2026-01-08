const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const qrcode = require("qrcode-terminal");
const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public-feedback"));

const OWNER = "6285928087634@s.whatsapp.net";
const DB_FILE = "./database_user.txt";
const FEEDBACK_FILE = "./feedback_data.txt";

let sock;
let isConnected = false; // ✅ FIX: FLAG KONEKSI

// =======================
// WHATSAPP BOT
// =======================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    sock = makeWASocket({
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    // === QR CODE TERMINAL ===
    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            isConnected = true; // ✅ FIX
            console.log("✅ WhatsApp Bot Connected");
        }

        if (connection === "close") {
            isConnected = false; // ✅ FIX
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== 401;

            console.log("⚠️ Connection closed. Reconnect:", shouldReconnect);

            if (shouldReconnect) {
                startBot();
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const number = jid.split("@")[0];

        let db = {};
        if (fs.existsSync(DB_FILE)) {
            fs.readFileSync(DB_FILE, "utf-8")
                .split("\n")
                .filter(Boolean)
                .forEach(line => {
                    const [num, count] = line.split("|");
                    db[num] = parseInt(count);
                });
        }

        db[number] = (db[number] || 0) + 1;

        const save = Object.entries(db)
            .map(([n, c]) => `${n}|${c}`)
            .join("\n");
        fs.writeFileSync(DB_FILE, save);

        if (db[number] === 2) {
            await sock.sendMessage(jid, {
                text: `🙏 Terima kasih sudah menggunakan ExodusAI!

Kami ingin mendengar pendapat kamu.
Silakan isi feedback & rating di link berikut:

🌐 http://localhost:8181`
            });
        }
    });
}

startBot();

// =======================
// WEB FORM SUBMIT
// =======================
app.post("/submit", async (req, res) => {
    try {
        console.log("FEEDBACK MASUK:", req.body); // ✅ DEBUG

        const data = req.body;

        // === NORMALISASI NOMOR WA (AMAN) ===
        let wa = data.whatsapp.replace(/^0/, "62");
        const userJid = wa + "@s.whatsapp.net";

        const log = `
========================
Nama: ${data.nama}
WhatsApp: ${wa}
Kepuasan: ${data.puas}
AI Quality: ${data.ai}
Speed: ${data.speed}
Fitur: ${data.fitur}
Kemudahan: ${data.mudah}
Stabilitas: ${data.stabil}
Terbaik: ${data.best}
Perbaikan: ${data.fix}
Fitur Baru: ${data.future}
Rekomendasi: ${data.recommend}
Testimoni: ${data.permission}
========================
`;

        // ✅ PASTIKAN FILE TERBUAT
        fs.appendFileSync(FEEDBACK_FILE, log);

        // === KIRIM WA JIKA CONNECTED ===
        if (sock && isConnected) {
            await sock.sendMessage(userJid, {
                text: `Halo ${data.nama}! 👋  
Terima kasih! Feedback kamu sangat membantu perkembangan ExodusAI 🚀`
            });

            await sock.sendMessage(OWNER, {
                text: `📊 FEEDBACK BARU EXODUSAI\n${log}`
            });
        }

        res.json({ status: true });
    } catch (err) {
        console.error("SUBMIT ERROR:", err);
        res.status(500).json({ error: "Internal error" });
    }
});

app.listen(8181, () => {
    console.log("🌐 Web Feedback berjalan di http://localhost:8181");
});
