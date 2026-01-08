const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const OWNER = "6285928087634@s.whatsapp.net";
const DB_FILE = "./database_user.txt";
const FEEDBACK_FILE = "./feedback_data.txt";

let sock;

// =======================
// WHATSAPP BOT
// =======================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);

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

        // Simpan ulang
        const save = Object.entries(db)
            .map(([n, c]) => `${n}|${c}`)
            .join("\n");
        fs.writeFileSync(DB_FILE, save);

        // Jika sudah 2 chat → kirim link feedback
        if (db[number] === 2) {
            await sock.sendMessage(jid, {
                text: `🙏 Terima kasih sudah menggunakan ExodusAI!

Kami ingin mendengar pendapat kamu.
Silakan isi feedback & rating di link berikut:

🌐 http://localhost:3000`
            });
        }
    });
}

startBot();

// =======================
// WEB FORM SUBMIT
// =======================
app.post("/submit", async (req, res) => {
    const data = req.body;

    const log = `
========================
Nama: ${data.nama}
WhatsApp: ${data.whatsapp}
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

    fs.appendFileSync(FEEDBACK_FILE, log);

    // Kirim ke USER
    await sock.sendMessage(`${data.whatsapp}@s.whatsapp.net`, {
        text: `Halo ${data.nama}! 👋  
Terima kasih telah mengisi feedback anda 🙏`
    });

    // Kirim ke OWNER
    await sock.sendMessage(OWNER, {
        text: `📊 FEEDBACK BARU EXODUSAI\n${log}`
    });

    res.json({ status: true });
});

app.listen(3000, () => {
    console.log("🌐 Web Feedback berjalan di http://localhost:3000");
});
