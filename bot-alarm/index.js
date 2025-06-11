// === WhatsApp Bot using Baileys (CommonJS style) ===

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    downloadMediaMessage,
    proto,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');
const cron = require('node-cron');
const moment = require('moment-timezone');

// === Inisialisasi Store (untuk logging atau penggunaan lanjutan) ===
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

// === Fungsi utama ===
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

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
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'Pong 🏓' });
        }
    });

    // Contoh: Kirim alarm setiap pukul 07:00 WIB
    cron.schedule('48 23 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `⏰ Alarm! Sekarang jam ${jam} WIB.`;

        const jid = '6287769811262@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });
}

startBot();
