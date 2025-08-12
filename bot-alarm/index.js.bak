const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');

// === Konstanta ===
const MESSAGE_COUNT_FILE = './user_message_count.json';
const PROMO_INTERVAL = 10;

// === Load & Simpan Data ke File ===
let userMessageCount = {};

function loadMessageData() {
    if (fs.existsSync(MESSAGE_COUNT_FILE)) {
        const data = JSON.parse(fs.readFileSync(MESSAGE_COUNT_FILE));
        userMessageCount = data.userMessageCount || {};
    }
}

function saveMessageData() {
    fs.writeFileSync(MESSAGE_COUNT_FILE, JSON.stringify({ userMessageCount }, null, 2));
}

// === Fungsi Utama ===
async function startBot() {
    loadMessageData();

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_alarm');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });
    store.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Reconnect?', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot terkoneksi!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;

        // Hanya tangani chat pribadi (bukan grup)
        if (sender.endsWith('@g.us')) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Hitung jumlah pesan
        userMessageCount[sender] = (userMessageCount[sender] || 0) + 1;

        // Cek kelipatan 10
        if (userMessageCount[sender] % PROMO_INTERVAL === 0) {
            const promo = `🚀 Suka pakai *ExodusAI*?\nYuk bantu share ke teman-teman kamu biar mereka juga bisa ngerasain kecanggihannya!🤖✨`;
            await sock.sendMessage(sender, { text: promo });
        }

        saveMessageData();

        // Contoh command ping
        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'Pong 🏓' });
        }
    });

    // === Cron Jadwal Tambahan (Opsional) ===
    cron.schedule('02 21 * * *', async () => {
        const pesan = `sayang bangun sayang`;
        const jid = '62895351640508@s.whatsapp.net';
        await sock.sendMessage(jid, { text: pesan });
    });

    cron.schedule('03 21 * * *', async () => {
        const pesan = `sayangkuuu bangun sayangkuuuu`;
        const jid = '62895351640508@s.whatsapp.net';
        await sock.sendMessage(jid, { text: pesan });
    });
}

startBot();
