// bot.js
//const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, makeInMemoryStore, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const path = require('path');

const authFile = path.resolve('./auth_info/auth_info.json');
const { state, saveState } = useMultiFileAuthState(authFile);

let sock = null;
let store = makeInMemoryStore({});

async function startBot() {
  try {
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(()=>({ version: [2, 2204, 13], isLatest: true }));
    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      // logger: P({ level: 'debug' })
    });

    store.bind(sock.ev);

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
          // try restart
          setTimeout(() => startBot(), 5000);
        }
      }
    });

    sock.ev.on('creds.update', saveState);
  } catch (e) {
    console.error('Bot error', e);
  }
}

function isReady() {
  return sock != null && sock.user != null;
}

async function sendWhatsAppMessage(phoneNumber, text) {
  // phoneNumber expected like '6287769811262'
  if (!sock) throw new Error('Bot not connected yet');
  // convert to id
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
