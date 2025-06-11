const makeWASocket = require('@whiskeysockets/baileys').default
const { DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')
const cron = require('node-cron')
const moment = require('moment-timezone')

// ✅ FIX di sini, ambil langsung dari path internal
const { useSingleFileAuthState } = require('@whiskeysockets/baileys/lib/Utils/auth-utils')

const { state, saveState } = useSingleFileAuthState('./auth_info.json')

const startSock = () => {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        : true

      if (shouldReconnect) {
        startSock()
      }
    } else if (connection === 'open') {
      console.log('✅ Bot terhubung!')
    }
  })

  sock.ev.on('creds.update', saveState)

  // Cron untuk kirim pesan jam 23:20 WIB (16:20 UTC)
  cron.schedule('20 16 * * *', async () => {
    const jidTujuan = '628XXXXXXXXXX@s.whatsapp.net' // Ganti nomor
    const waktu = moment().tz('Asia/Jakarta').format('HH:mm')
    await sock.sendMessage(jidTujuan, { text: `⏰ Alarm otomatis! Sekarang jam ${waktu} WIB.` })
  })
}

startSock()
