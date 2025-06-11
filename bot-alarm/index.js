import makeWASocket, {
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys';

import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import moment from 'moment-timezone';
import fs from 'fs';

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
      console.log('[!] Scan QR code berikut:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('[!] Koneksi terputus.');
      if (shouldReconnect) {
        connectBot();
      } else {
        console.log('[!] Bot logout permanen.');
      }
    } else if (connection === 'open') {
      console.log('[✓] Bot berhasil terhubung!');
    }
  });

  // Ganti nomor ini ke nomor kamu
  const targetJid = '6281234567890@s.whatsapp.net';

  async function sendRepeatedMessage(jid, message, count) {
    for (let i = 0; i < count; i++) {
      await sock.sendMessage(jid, { text: message });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Cron 21:00 WITA = 13:00 UTC
  cron.schedule('0 13 * * *', async () => {
    console.log('[⏰] Kirim pesan tidur...');
    await sendRepeatedMessage(targetJid, 'Hey, saatnya tidur!', 5);
  });

  // Cron 05:00 WITA = 21:00 UTC (hari sebelumnya)
  cron.schedule('0 21 * * *', async () => {
    console.log('[⏰] Kirim pesan bangun...');
    await sendRepeatedMessage(targetJid, 'Hey, saatnya bangun!', 5);
  });

  // Contoh tambahan: kirim jam 23:20 WITA = 15:20 UTC
  cron.schedule('20 15 * * *', async () => {
    console.log('[⏰] Kirim pesan custom 23:20 WITA...');
    await sendRepeatedMessage(targetJid, 'Ini pesan jam 23:20 WITA!', 5);
  });
}

connectBot();
