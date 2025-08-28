import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';


let sock = null;
let ready = false;


export async function initWhatsApp() {
const sessionDir = path.join(process.cwd(), 'session_data');
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
const { state, saveCreds } = await useMultiFileAuthState(sessionDir);


sock = makeWASocket({
auth: state,
printQRInTerminal: true,
browser: ['InvoiceSaaS','Chrome','1.0'],
});


sock.ev.on('creds.update', saveCreds);


sock.ev.on('connection.update', (update) => {
const { connection, lastDisconnect, qr } = update;
if (qr) qrcode.generate(qr, { small: true });
if (connection === 'open') {
ready = true;
console.log('[WA] Connected');
} else if (connection === 'close') {
const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
console.log('[WA] Connection closed', shouldReconnect ? 'reconnecting...' : 'logged out');
ready = false;
if (shouldReconnect) initWhatsApp();
}
});
}


function normalizeNumber(num) {
// Expect Indonesian numbers like 62812xxxx; ensure JID format
const digits = String(num).replace(/[^0-9]/g, '');
return digits + '@s.whatsapp.net';
}


export async function sendText(toNumber, message) {
try {
if (!sock || !ready) {
console.warn('[WA] Not ready, message queued to console:', toNumber, message);
return false;
}
await sock.sendMessage(normalizeNumber(toNumber), { text: message });
return true;
} catch (e) {
console.error('[WA] sendText error:', e.message);
return false;
}
}