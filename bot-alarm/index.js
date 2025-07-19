const baileys = require("@whiskeysockets/baileys");
const { useSingleFileAuthState } = require("@whiskeysockets/baileys/lib/Utils");

const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = baileys;
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// Gunakan single file auth state (bisa juga pakai multi file)
const { state, saveState } = useSingleFileAuthState('./auth.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Simpan sesi saat ada perubahan
    sock.ev.on('creds.update', saveState);

    // Handle disconnect
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Reconnect:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot terhubung!');
        }
    });

    // Handle pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        const msg = messages[0];

        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const content = msg.message;

        // Hanya respon jika dari nomor 6287769811262
        if (!sender.includes('6287769811262')) return;

        // Deteksi View Once
        if (content.viewOnceMessageV2) {
            const viewOnceMsg = content.viewOnceMessageV2.message;
            const messageType = Object.keys(viewOnceMsg)[0]; // 'imageMessage' atau 'videoMessage'

            try {
                const buffer = await downloadMediaMessage(
                    { message: viewOnceMsg },
                    "buffer",
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );

                if (messageType === 'imageMessage') {
                    await sock.sendMessage(sender, {
                        image: buffer,
                        caption: 'Ini foto view once kamu.',
                    }, { quoted: msg });
                } else if (messageType === 'videoMessage') {
                    await sock.sendMessage(sender, {
                        video: buffer,
                        caption: 'Ini video view once kamu.',
                    }, { quoted: msg });
                }

                console.log('✅ ViewOnce media berhasil dikirim ulang.');
            } catch (err) {
                console.error('❌ Gagal mengambil media ViewOnce:', err);
            }
        } else {
            console.log('📥 Pesan biasa dari', sender);
        }
    });
}

startBot();
