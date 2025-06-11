import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys';

import { default as baileys } from '@whiskeysockets/baileys';
const { useSingleFileAuthState } = await import('@whiskeysockets/baileys/lib/utils/auth-utils.js').then(mod => mod);


import qrcode from 'qrcode-terminal';
import cron from 'node-cron';

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectBot() {
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('Scan QR ini:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        connectBot();
      } else {
        console.log('Bot logout.');
      }
    } else if (connection === 'open') {
      console.log('Bot terkoneksi!');
    }
  });

  const targetJid = '6281234567890@s.whatsapp.net';

  async function sendRepeatedMessage(jid, text, count) {
    for (let i = 0; i < count; i++) {
      await sock.sendMessage(jid, { text });
      await new Promise(res => setTimeout(res, 1000));
    }
  }

  // 21:00 WITA (UTC+8) = 13:00 UTC
  cron.schedule('0 13 * * *', () => {
    sendRepeatedMessage(targetJid, 'Hey, saatnya tidur!', 5);
  });

  // 05:00 WITA (UTC+8) = 21:00 UTC (hari sebelumnya)
  cron.schedule('0 21 * * *', () => {
    sendRepeatedMessage(targetJid, 'Hey, saatnya bangun!', 5);
  });
}

connectBot();
