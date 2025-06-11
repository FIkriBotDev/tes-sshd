const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default;
const { useSingleFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = baileys;

const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const moment = require('moment-timezone');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectBot() {
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('[!] Scan QR code:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('[!] Koneksi terputus.');
            if (shouldReconnect) {
                connectBot();
            } else {
                console.log('[!] Bot logout.');
            }
        } else if (connection === 'open') {
            console.log('[✓] Bot terhubung!');
        }
    });

    const targetJid = '6287769811262@s.whatsapp.net';

    async function sendRepeatedMessage(jid, message, count) {
        for (let i = 0; i < count; i++) {
            await sock.sendMessage(jid, { text: message });
            await new Promise(res => setTimeout(res, 1000));
        }
    }

    cron.schedule('22 15 * * *', async () => {
        await sendRepeatedMessage(targetJid, 'Hey, saatnya tidur!', 5);
    });

    cron.schedule('0 21 * * *', async () => {
        await sendRepeatedMessage(targetJid, 'Hey, saatnya bangun!', 5);
    });
}

connectBot();
