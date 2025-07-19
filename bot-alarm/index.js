const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    DisconnectReason,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');

const P = require('pino');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');

// === Fungsi Utama ===
async function startBot() {
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
            console.log('✅ Bot terkoneksi!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const content = msg.message;

        // Hanya dari nomor 6287769811262
        if (!sender.includes('6287769811262')) return;

        // Deteksi pesan viewOnce
        const viewOnce = content?.viewOnceMessageV2 || content?.viewOnceMessage;
        if (viewOnce) {
            const viewOnceMsg = viewOnce.message;
            const messageType = Object.keys(viewOnceMsg)[0]; // imageMessage atau videoMessage

            try {
                const buffer = await downloadMediaMessage(
                    { message: viewOnceMsg },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );

                if (messageType === 'imageMessage') {
                    await sock.sendMessage(sender, {
                        image: buffer,
                        caption: '📸 Ini foto view-once kamu.'
                    });
                } else if (messageType === 'videoMessage') {
                    await sock.sendMessage(sender, {
                        video: buffer,
                        caption: '🎥 Ini video view-once kamu.'
                    });
                }

                console.log(`✅ ViewOnce media dari ${sender} berhasil dikirim ulang.`);
            } catch (err) {
                console.error('❌ Gagal mengambil media ViewOnce:', err);
            }
        } else {
            console.log(`📥 Pesan biasa dari ${sender}`);
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
