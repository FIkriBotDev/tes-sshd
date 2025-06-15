// === WhatsApp Bot using Baileys (CommonJS style) ===

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    downloadMediaMessage,
    proto,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');
const cron = require('node-cron');
const moment = require('moment-timezone');

// === Inisialisasi Store (untuk logging atau penggunaan lanjutan) ===
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

// === Fungsi utama ===
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_alarm');

    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    store.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Reconnect?', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Bot terkoneksi!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'Pong 🏓' });
        }
    });

     // Schedule 1 Bobo
    cron.schedule('00 15 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `Sayangg jangan lupa bobo yaaa uda malem niii💤`;

        const jid = '62895351640508@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });

// Schedule 2 Dino
    cron.schedule('00 18 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `Hai, aku baru beli saham pertamaku di Ajaib. 📈 Coba sendiri dan miliki perusahaan seperti bank BCA, bank BRI dan Antam. Kalau kamu daftar pakai kode Ajaib muhaq3bx, kita berdua bisa otomatis dapat hadiah saham hingga Rp100 juta setelah kamu beli saham pertamamu. Klik di sini: https://referral.ajaib.co.id/Qhwq `;
        const jid = '6285735098913@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });

    // Schedule 2 Dino
    cron.schedule('01 18 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `Hai, aku baru beli saham pertamaku di Ajaib. 📈 Coba sendiri dan miliki perusahaan seperti bank BCA, bank BRI dan Antam. Kalau kamu daftar pakai kode Ajaib muhaq3bx, kita berdua bisa otomatis dapat hadiah saham hingga Rp100 juta setelah kamu beli saham pertamamu. Klik di sini: https://referral.ajaib.co.id/Qhwq `;
        const jid = '6288242147173@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });

      // Schedule 2 Dino
    cron.schedule('02 18 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `Hai, aku baru beli saham pertamaku di Ajaib. 📈 Coba sendiri dan miliki perusahaan seperti bank BCA, bank BRI dan Antam. Kalau kamu daftar pakai kode Ajaib muhaq3bx, kita berdua bisa otomatis dapat hadiah saham hingga Rp100 juta setelah kamu beli saham pertamamu. Klik di sini: https://referral.ajaib.co.id/Qhwq `;
        const jid = '6281382737567@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });

          // Schedule 2 Dino
    cron.schedule('03 18 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `Hai, aku baru beli saham pertamaku di Ajaib. 📈 Coba sendiri dan miliki perusahaan seperti bank BCA, bank BRI dan Antam. Kalau kamu daftar pakai kode Ajaib muhaq3bx, kita berdua bisa otomatis dapat hadiah saham hingga Rp100 juta setelah kamu beli saham pertamamu. Klik di sini: https://referral.ajaib.co.id/Qhwq `;
        const jid = '6287761368878@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });

    // Schedule 3 Bangun
    cron.schedule('30 23 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `Sayang bangunnnnnn bangun sayangggg uda pagiii😘`;

        const jid = '62895351640508@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });
        // Schedule 3 Bangun
    cron.schedule('31 23 * * *', async () => {
        const jam = moment().tz('Asia/Makassar').format('HH:mm');
        const pesan = `Heyy bangun`;

        const jid = '6287769811262@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
        await sock.sendMessage(jid, { text: pesan });
    });
// Schedule 3 Salat
//    cron.schedule('30 22 * * *', async () => {
 //      const jam = moment().tz('Asia/Makassar').format('HH:mm');
  //      const pesan = `🌅 : Haii sayangkuu bangun sayang udaa pagi nii jangan lupa salat subuh yaa😘`;
//
  //      const jid = '62895351640508@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
  //      await sock.sendMessage(jid, { text: pesan });
//    });
//
// Schedule 4 Pagi
 //   cron.schedule('00 23 * * *', async () => {
  //      const jam = moment().tz('Asia/Makassar').format('HH:mm');
   //     const pesan = `🌅 : Good Morning Sayangggg`;

    //    const jid = '62895351640508@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
    //    await sock.sendMessage(jid, { text: pesan });
  //  });

// Schedule 5 Makan
  //  cron.schedule('00 01 * * *', async () => {
    //    const jam = moment().tz('Asia/Makassar').format('HH:mm');
    //    const pesan = `🥗 : Sayang udah jam segini jangan lupa mam yaa sayangkuuu😘`;

   //     const jid = '62895351640508@s.whatsapp.net'; // Ganti dengan nomor WA tujuan
     //   await sock.sendMessage(jid, { text: pesan });
   // });

}

startBot();
