import pkg from '@whiskeysockets/baileys';
const {
  default: makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = pkg;

import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import moment from 'moment-timezone';

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectBot() {
  const { version } = await fetchLatestBaileysVersion();

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
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
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

  const targetJid = '6281234567890@s.whatsapp.net';

  async function sendRepeatedMessage(jid, message, count) {
    for (let i = 0; i < count; i++) {
      await sock.sendMessage(jid, { text: message });
      await new Promise((res) => setTimeout(res, 1000));
    }
  }

  // Cron 21:00 WITA (UTC+8) = 13:00 UTC
  cron.schedule('0 13 * * *', async () => {
    await sendRepeatedMessage(targetJid, 'Hey, saatnya tidur!', 5);
  });

  // Cron 05:00 WITA (UTC+8) = 21:00 UTC (hari sebelumnya)
  cron.schedule('0 21 * * *', async () => {
    await sendRepeatedMessage(targetJid, 'Hey, saatnya bangun!', 5);
  });
}

connectBot();
