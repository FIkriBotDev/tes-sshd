const { default: makeWASocket, useSingleFileAuthState, downloadMediaMessage, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// Gunakan single file auth
const { state, saveState } = useSingleFileAuthState('./auth.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Koneksi terputus. Reconnect:', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot terhubung!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const content = msg.message;

        // Hanya tanggapi pesan dari 6287769811262
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
                        caption: '📸 Ini foto view-once kamu.',
                    });
                } else if (messageType === 'videoMessage') {
                    await sock.sendMessage(sender, {
                        video: buffer,
                        caption: '🎥 Ini video view-once kamu.',
                    });
                }

                console.log(`✅ ViewOnce media dari ${sender} berhasil dikirim ulang.`);
            } catch (err) {
                console.error('❌ Gagal mengambil media ViewOnce:', err);
            }
        } else {
            console.log(`📥 Pesan biasa dari ${sender}.`);
        }
    });
}

startBot();
