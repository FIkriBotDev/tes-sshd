// bot.js
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');
const path = require('path');

// Lokasi penyimpanan auth
const authFile = path.resolve('./auth_info');
let sock = null;

// Start bot
async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authFile);

    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 2204, 13],
      isLatest: true
    }));

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) qrcode.generate(qr, { small: true });

      if (connection === 'open') {
        console.log('✅ WhatsApp bot connected');
      }

      if (connection === 'close') {
        const code = (lastDisconnect?.error)?.output?.statusCode;
        console.log('connection closed', code);
        if (code === DisconnectReason.loggedOut) {
          console.log('Logged out — delete auth_info and restart to re-scan QR');
        } else {
          // coba restart
          setTimeout(() => startBot(), 5000);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (e) {
    console.error('Bot error', e);
  }
}

// Check apakah bot sudah siap
function isReady() {
  return sock != null && sock.user != null;
}

// Fungsi kirim pesan
async function sendWhatsAppMessage(phoneNumber, text) {
  if (!sock) throw new Error('Bot not connected yet');
  const jid = phoneNumber + '@s.whatsapp.net';
  try {
    const result = await sock.sendMessage(jid, { text });
    return result;
  } catch (e) {
    console.error('Send message failed', e?.message || e);
    throw e;
  }
}

module.exports = { startBot, sendWhatsAppMessage, isReady };
