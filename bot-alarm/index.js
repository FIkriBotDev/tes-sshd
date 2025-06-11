import pkg from '@whiskeysockets/baileys'
const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = pkg

import qrcode from 'qrcode-terminal'
import cron from 'node-cron'
import { Boom } from '@hapi/boom'

const { state, saveState } = useSingleFileAuthState('./auth_info.json')
const startSock = () => {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveState)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('connection closed due to', lastDisconnect?.error, ', reconnecting', shouldReconnect)
      if (shouldReconnect) {
        startSock()
      }
    } else if (connection === 'open') {
      console.log('Bot connected.')
    }
  })

  // Target nomor WA kamu
  const targetNumber = '6281234567890@s.whatsapp.net' // ← ganti dengan nomor kamu

  // Fungsi untuk mengirim 5 pesan
  async function sendAlarmMessage(message) {
    for (let i = 0; i < 5; i++) {
      await sock.sendMessage(targetNumber, { text: message })
    }
  }

  // Jadwal alarm jam 21:00 WITA (WITA = UTC+8 → cron pakai UTC)
  cron.schedule('0 13 * * *', () => {
    sendAlarmMessage('Hey, saatnya tidur!')
  })

  // Jadwal alarm jam 05:00 WITA → berarti 21:00 UTC hari sebelumnya
  cron.schedule('0 21 * * *', () => {
    sendAlarmMessage('Hey, saatnya bangun!')
  })
}

startSock()
