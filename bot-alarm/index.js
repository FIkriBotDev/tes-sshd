import pkg from '@whiskeysockets/baileys'
const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = pkg

import qrcode from 'qrcode-terminal'
import cron from 'node-cron'
import { Boom } from '@hapi/boom'
import moment from 'moment-timezone'

const { state, saveState } = useSingleFileAuthState('./auth_info.json')

const startSock = () => {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
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

  // Cron untuk mengirim pesan jam 23:20 WIB
  cron.schedule('20 16 * * *', async () => {
    const jidTujuan = '628XXXXXXXXXX@s.whatsapp.net' // ganti nomor tujuan
    const waktu = moment().tz('Asia/Jakarta').format('HH:mm')
    await sock.sendMessage(jidTujuan, { text: `⏰ Alarm otomatis! Sekarang jam ${waktu} WIB.` })
  })
}

startSock()
