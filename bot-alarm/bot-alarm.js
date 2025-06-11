const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const moment = require('moment-timezone');
const fs = require('fs');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectBot() {
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false, // kita pakai qrcode-terminal manual
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('[!] Scan QR code di bawah ini menggunakan WhatsApp kamu:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('[!] Koneksi terputus.', lastDisconnect?.error);
            if (shouldReconnect) {
                connectBot();
            } else {
                console.log('[!] Bot logout. Silakan hapus auth_info.json jika ingin login ulang.');
            }
        } else if (connection === 'open') {
            console.log('[✓] Bot berhasil terhubung.');
        }
    });

    // Ganti dengan nomor tujuan
    const targetJid = '6287769811262@s.whatsapp.net'; // nomor kamu

    async function sendRepeatedMessage(jid, message, count) {
        for (let i = 0; i < count; i++) {
            await sock.sendMessage(jid, { text: message });
            await new Promise(resolve => setTimeout(resolve, 1000)); // delay 1 detik
        }
    }

    // Cron 21:00 WITA = 13:00 UTC
    cron.schedule('0 13 * * *', async () => {
        console.log('[⏰] Mengirim pesan tidur...');
        await sendRepeatedMessage(targetJid, 'Hey, saatnya tidur!', 5);
    });

    // Cron 05:00 WITA = 21:00 UTC (hari sebelumnya)
    cron.schedule('0 21 * * *', async () => {
        console.log('[⏰] Mengirim pesan bangun...');
        await sendRepeatedMessage(targetJid, 'Hey, saatnya bangun!', 5);
    });
}

connectBot();
