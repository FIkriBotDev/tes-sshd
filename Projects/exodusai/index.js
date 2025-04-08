// === Versi Baileys dari WhatsApp Bot ===

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    downloadMediaMessage,
    proto,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const P = require('pino');

const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

// === Upload file function ===
const uploadFile = async (buffer) => {
    try {
        const { ext } = await fromBuffer(buffer);
        if (!ext) throw new Error('Could not determine file type from buffer');

        let form = new FormData();
        form.append('file', buffer, 'tmp.' + ext);

        const response = await axios.post('https://uploader.nyxs.pw/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        const urlMatch = response.data.match(/https:\/\/uploader\.nyxs\.pw\/tmp\/[^"]+/);
        if (!urlMatch) throw new Error('URL not found in upload response');

        const uploadedUrl = urlMatch[0].replace(/"/g, '');
        console.log('Uploaded File URL:', uploadedUrl);
        return uploadedUrl;
    } catch (error) {
        console.error('Error during file upload:', error);
        throw error;
    }
};

function loadConversation(fileName) {
    const data = fs.readFileSync(fileName);
    const parsedData = JSON.parse(data);
    return parsedData.default_conversation || [];
}

let userConversations = {};
let userModes = {};

function getConversation(userId) {
    if (!userConversations[userId]) {
        const fileName = userId === '6287863293173@s.whatsapp.net' ? 'dika.json' :
                         userId === '6287769811262@s.whatsapp.net' ? 'fikri.json' :
                         userId === '6287824613268@s.whatsapp.net' ? 'say.json' :
                         userId === '6282269995370@s.whatsapp.net' ? 'sis.json' :
                         userId === '6282142719548@s.whatsapp.net' ? 'fu.json' :
                         userId === '62895351640508@s.whatsapp.net' ? 'april.json' :
                         userId === '6285271848176@s.whatsapp.net' ? 'nuni.json' : 'database.json';
        userConversations[userId] = loadConversation(fileName);
    }
    return userConversations[userId];
}

function saveConversation(userId, conversation) {
    userConversations[userId] = conversation;
}

function setMode(userId, mode) {
    userModes[userId] = mode;
}

function getMode(userId) {
    return userModes[userId] || 'chatbot';
}

// === Start Bot with updated Baileys Auth ===
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state,
        logger: P({ level: 'silent' }),
        browser: ['ExodusAI', 'Chrome', '1.0.0']
    });

    store.bind(sock.ev);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[DEBUG] Connection closed. Reconnect?', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('[DEBUG] You are logged out.');
            }
        } else if (connection === 'open') {
            console.log('[DEBUG] Bot is connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const sender = m.key.remoteJid;
        const messageType = Object.keys(m.message)[0];
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const userMessage = text.trim().toLowerCase();

        let conversation = getConversation(sender);
        const currentMode = getMode(sender);

        if (userMessage === '/mode') {
            await sock.sendMessage(sender, { text: "*Berikut adalah mode yang tersedia di ExodusAI*\n\n=> AI ChatBot [/mode chatbot]\n=> AI Image Generator [/mode image-generator]" });
            return;
        }
        if (userMessage === '/mode chatbot') {
            setMode(sender, 'chatbot');
            await sock.sendMessage(sender, { text: 'Mode berhasil diubah ke AI ChatBot.' });
            return;
        }
        if (userMessage === '/mode image-generator') {
            setMode(sender, 'image-generator');
            await sock.sendMessage(sender, { text: 'Mode berhasil diubah ke AI Image Generator.' });
            return;
        }

        if (m.message.imageMessage || m.message.videoMessage || m.message.audioMessage || m.message.documentMessage) {
            try {
                const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage });
                const uploadedFileUrl = await uploadFile(buffer);

                let geminiPrompt = userMessage || (m.message.audioMessage ? 'dengarkan audio ini' : m.message.videoMessage ? 'video apa ini' : 'lihatlah gambar ini');

                const geminiApiUrl = `https://gemini-api.exoduscloud.my.id/api/gemini-image?text=${encodeURIComponent(geminiPrompt)}&url=${encodeURIComponent(uploadedFileUrl)}`;
                const geminiResponse = await fetch(geminiApiUrl).then(res => res.json());

                if (!geminiResponse.status || !geminiResponse.result) {
                    await sock.sendMessage(sender, { text: 'Maaf, file tidak dapat dianalisis.' });
                    return;
                }

                const geminiResult = geminiResponse.result;
                conversation.push({
                    role: "user",
                    content: `Berikut ini adalah text dari gemini result: \"${geminiResult}\". Sekarang kirimkan gemini result tersebut ke user dengan menggunakan bahasa kamu (bahasa gaul seperti yang kamu gunakan) dan tambahkan sedikit kata kata biar lebih kreatif. dan kirimkan text nya saja tanpa perlu semacam kamu kirim \"Ini adalah hasilnya\" cukup kirimkan text yang kamu ubah saja.`
                });

                const chatbotResponse = await fetch('https://rtist-api.exoduscloud.my.id/post/rtist', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ messages: conversation }),
                });

                const chatbotData = await chatbotResponse.json();
                const aiResponse = chatbotData.result;
                await sock.sendMessage(sender, { text: aiResponse });
                conversation.push({ role: "assistant", content: aiResponse });
                saveConversation(sender, conversation);

            } catch (err) {
                console.error('Error processing media:', err);
                await sock.sendMessage(sender, { text: 'Terjadi kesalahan saat memproses file.' });
            }
            return;
        }

        if (currentMode === 'chatbot') {
            conversation.push({ role: "user", content: userMessage });
            try {
                const response = await fetch('https://rtist-api.exoduscloud.my.id/post/rtist', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ messages: conversation }),
                });
                const data = await response.json();

                if (data.status && data.result && !data.result.error) {
                    const aiResponse = data.result;
                    const imageRegex = /!\[.*?\]\((https?:\/\/[^\s]+)\)/g;
                    let match = imageRegex.exec(aiResponse);

                    if (match) {
                        const imageUrl = match[1];
                        const [textBefore, textAfter] = aiResponse.split(match[0]);

                        if (textBefore.trim()) await sock.sendMessage(sender, { text: 'Oke bro! Tunggu ya gue lagi buatin gambar nya.✨' });
                        const imageBuffer = await fetch(imageUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, { image: imageBuffer, caption: textAfter.trim() });
                    } else {
                        await sock.sendMessage(sender, { text: aiResponse.trim() });
                    }
                    conversation.push({ role: "assistant", content: aiResponse });
                    saveConversation(sender, conversation);
                } else {
                    await sock.sendMessage(sender, { text: 'Mohon maaf terjadi kesalahan...' });
                }
            } catch (err) {
                console.error('Chatbot error:', err);
                await sock.sendMessage(sender, { text: 'Mohon maaf terjadi kesalahan...' });
            }
        }
    });
}

startBot();
