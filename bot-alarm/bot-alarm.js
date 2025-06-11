import { default as makeWASocket, useSingleFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import cron from 'node-cron';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
});

sock.ev.on('creds.update', saveState);

sock.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
    console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting', shouldReconnect);
    if (shouldReconnect) startSock();
  } else if (connection === 'open') {
    console.log('opened connection');
  }
});

async function sendRepeatedMessage(jid, message, count = 5) {
  for (let i = 0; i < count; i++) {
    await sock.sendMessage(jid, { text: message });
  }
}

// Ganti dengan nomor WA kamu sendiri (pakai format internasional +62xxxx)
const targetJid = '628xxxxxx@s.whatsapp.net';

// Kirim alarm jam 21:00 WITA (artinya jam 13:00 UTC jika pakai default cron timezone)
cron.schedule('0 13 * * *', () => {
  sendRepeatedMessage(targetJid, 'Hey, saatnya tidur!');
});

// Kirim alarm jam 05:00 WITA (artinya jam 21:00 UTC sebelumnya)
cron.schedule('0 21 * * *', () => {
  sendRepeatedMessage(targetJid, 'Hey, saatnya bangun!');
});
