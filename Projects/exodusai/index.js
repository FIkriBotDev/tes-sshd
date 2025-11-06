// === Versi Baileys dari WhatsApp Bot ===
// Jangan nyolong script orang woy!
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
const fileType = require('file-type');
const P = require('pino');

const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

// === Upload file function ===
const uploadFile = async (buffer) => {
    try {
        const { ext } = await fileType.fromBuffer(buffer);
        if (!ext) throw new Error('Could not determine file type from buffer');

        let form = new FormData();
        form.append('file', buffer, 'tmp.' + ext);

        const response = await axios.post('https://uploader.exodusai.biz.id/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        const uploadedUrl = response.data.url;
        if (!uploadedUrl) throw new Error('URL not found in upload response');

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
let userDocxMap = {}; // untuk menyimpan URL docx terakhir

function getConversation(userId) {
    if (!userConversations[userId]) {
        const fileName = userId === '6287863293173@s.whatsapp.net' ? 'dika.json' :
                         userId === '6287824613268@s.whatsapp.net' ? 'say.json' :
                         userId === '6283140117292@s.whatsapp.net' ? 'cece.json' :
                         userId === '6282269995370@s.whatsapp.net' ? 'sis.json' :
                         userId === '6282142719548@s.whatsapp.net' ? 'fu.json' :
                         userId === '62895351640508@s.whatsapp.net' ? 'april.json' :
                         userId === '6283897921042@s.whatsapp.net' ? 's.json' :
                         userId === '6285271848176@s.whatsapp.net' ? 'nuni.json' : '/home/runner/work/tes-sshd/tes-sshd/database.json';
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

// === Helper: Fix URL di response AI ===
function fixUrls(text) {
    if (!text) return text;
    return text.replace(/!\[.*?\]\((.*?)\)/g, (match, url) => {
        const safeUrl = encodeURI(url.trim()); // encode spasi & karakter aneh
        return match.replace(url, safeUrl);
    });
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
            if (shouldReconnect) startBot();
            else console.log('[DEBUG] You are logged out.');
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
        const userMessage = text.trim();
        let conversation = getConversation(sender);
        const currentMode = getMode(sender);

        // === Mode Menu
        if (userMessage === '/mode') {
            await sock.sendMessage(sender, {
                text: "*Berikut adalah mode yang tersedia di ExodusAI*\n\n" +
                      "=> AI ChatBot [/mode chatbot]\n" +
                      "=> AI Photo Editor [/mode photoeditor]"
            });
            return;
        }

        // === Mode Switch
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
        if (userMessage === '/mode photoeditor') {
            setMode(sender, 'photoeditor');
            await sock.sendMessage(sender, { text: 'Mode berhasil diubah ke AI Photo Editor (Image-to-Image).' });
            return;
        }

        // === AI Docx Handling (tidak diubah)
        if (m.message.documentMessage && m.message.documentMessage.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            try {
                const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage });
                const uploadedFileUrl = await uploadFile(buffer);
                userDocxMap[sender] = uploadedFileUrl;

                const caption = m.message.documentMessage.caption;
                if (caption) {
                    const apiUrl = `https://docx-ai.exodusai.biz.id/api/edit?documentUrl=${encodeURIComponent(uploadedFileUrl)}&prompt=${encodeURIComponent(caption)}`;
                    const response = await fetch(apiUrl);
                    const docxBuffer = await response.buffer();
                    await sock.sendMessage(sender, {
                        document: docxBuffer,
                        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        fileName: 'hasil-edit.docx'
                    });
                    delete userDocxMap[sender];
                } else {
                    await sock.sendMessage(sender, { text: "Bro, lo mau ngapain di file itu?" });
                }
            } catch (err) {
                console.error('Error uploading docx:', err);
                await sock.sendMessage(sender, { text: '❌ Gagal mengunggah file dokumen.' });
            }
            return;
        }

        // === Prompt setelah file .docx
        if (userDocxMap[sender]) {
            try {
                const documentUrl = userDocxMap[sender];
                const prompt = userMessage;
                const apiUrl = `https://docx-ai.exodusai.biz.id/api/edit?documentUrl=${encodeURIComponent(documentUrl)}&prompt=${encodeURIComponent(prompt)}`;
                const response = await fetch(apiUrl);
                const docxBuffer = await response.buffer();
                await sock.sendMessage(sender, {
                    document: docxBuffer,
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    fileName: 'hasil-edit.docx'
                });
                delete userDocxMap[sender];
            } catch (err) {
                console.error('AI Docx error:', err);
                await sock.sendMessage(sender, { text: '❌ Gagal memproses file.' });
            }
            return;
        }

        // === PhotoEditor Mode: Image-to-Image Pollinations
        if (currentMode === 'photoeditor' && m.message.imageMessage) {
            try {
                const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage });
                const uploadedFileUrl = await uploadFile(buffer);

                const caption = m.message.imageMessage.caption || 'enhance this photo';
                const prompt = encodeURIComponent(caption);
                const imageUrl = encodeURIComponent(uploadedFileUrl);
                const token = 'XOYha3sjdByNrw_q';
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${prompt}?model=kontext&token=${token}&image=${imageUrl}&nologo=true`;

                await sock.sendMessage(sender, { text: '🪄 Lagi gue edit dulu fotonya, tunggu bentar ya...' });
                const response = await fetch(pollinationsUrl);
                const resultBuffer = await response.buffer();

                await sock.sendMessage(sender, {
                    image: resultBuffer,
                    caption: `✨ Nih hasilnya bro! (${caption})`
                });
            } catch (err) {
                console.error('PhotoEditor error:', err);
                await sock.sendMessage(sender, { text: '❌ Gagal mengedit foto.' });
            }
            return;
        }

        // === Mode default lain (tetap seperti semula)
        // === Media, Chatbot, dll tetap sama seperti sebelumnya ===
        // === Mulai dari sini biarkan kode kamu yang sudah ada ===
        // === (kode media analysis dan chatbot response tetap berjalan seperti semula) ===

        // === Media (image/video/audio/document) ===
        if (m.message.imageMessage || m.message.videoMessage || m.message.audioMessage || m.message.documentMessage) {
            try {
                const buffer = await downloadMediaMessage(m, 'buffer', {}, { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage });
                const uploadedFileUrl = await uploadFile(buffer);

                let geminiPrompt = 'lihatlah gambar ini';
                const caption = m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.documentMessage?.caption;
                if (caption) geminiPrompt = caption;
                else if (userMessage) geminiPrompt = userMessage;

                const geminiApiUrl = `https://gemini-api.exodusai.biz.id/api/gemini-image?text=${encodeURIComponent(geminiPrompt)}&url=${encodeURIComponent(uploadedFileUrl)}`;
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

                const chatbotResponse = await fetch('http://localhost:3000/post/rtist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: conversation }),
                });

                const chatbotData = await chatbotResponse.json();
                let aiResponse = chatbotData.result;

                aiResponse = aiResponse.replace(/https:\/\/localhost:/gi, 'http://localhost:');
                aiResponse = aiResponse.replace(/https:\/\/pollinations\.ai/gi, 'https://www.exodusai.biz.id').trim();
                aiResponse = fixUrls(aiResponse);

                // === NEW: Deteksi & kirim file yang disertakan dalam response AI (DOCX, EXCEL, IMAGE, VIDEO)
                try {
                    // DOCX
                    const docxMarkdownRegex = /!\[.*?\]\((https:\/\/docx-ai\.exodusai\.biz\.id\/api\/buat\?[^)]+)\)/;
                    const matchDocx = docxMarkdownRegex.exec(aiResponse);
                    if (matchDocx) {
                        const docxUrl = matchDocx[1];
                        await sock.sendMessage(sender, { text: `Oke, gue buatin dulu ya dokumennya sesuai permintaan✨` });
                        const docxBuffer = await fetch(docxUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, {
                            document: docxBuffer,
                            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            fileName: 'hasil.docx'
                        });
                        aiResponse = aiResponse.replace(docxMarkdownRegex, '').trim();
                    }

                    // EXCEL
                    const excelMarkdownRegex = /!\[.*?\]\((https:\/\/docx-ai\.exodusai\.biz\.id\/api\/buat\/excel\?[^)]+)\)/;
                    const matchExcel = excelMarkdownRegex.exec(aiResponse);
                    if (matchExcel) {
                        const excelUrl = matchExcel[1];
                        await sock.sendMessage(sender, { text: `Oke, gue buatin dulu ya datanya sesuai permintaan ✨` });
                        const excelBuffer = await fetch(excelUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, {
                            document: excelBuffer,
                            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            fileName: 'hasil.xlsx'
                        });
                        aiResponse = aiResponse.replace(excelMarkdownRegex, '').trim();
                    }

                    // IMAGE (localhost image-generator)
                    const imageRegex = /!\[.*?\]\((http:\/\/localhost:3000\/get\/image-generator\/[^)]+)\)/;
                    const matchImage = imageRegex.exec(aiResponse);
                    if (matchImage) {
                        const imageUrl = matchImage[1];
                        const [textBefore, textAfter] = aiResponse.split(matchImage[0]);
                        if (textBefore && textBefore.trim()) await sock.sendMessage(sender, { text: textBefore.trim() });
                        const imageBuffer = await fetch(imageUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, { image: imageBuffer, caption: (textAfter || '').trim() });
                        aiResponse = aiResponse.replace(imageRegex, '').trim();
                    }

                    // VIDEO (localhost generatevideo)
                    const videoRegex = /!\[.*?\]\((http:\/\/localhost:3000\/get\/generatevideo\?[^)]+)\)/;
                    const matchVideo = videoRegex.exec(aiResponse);
                    if (matchVideo) {
                        const videoUrl = matchVideo[1];
                        const [textBefore, textAfter] = aiResponse.split(matchVideo[0]);
                        if (textBefore && textBefore.trim()) await sock.sendMessage(sender, { text: textBefore.trim() });
                        const videoBuffer = await fetch(videoUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, { video: videoBuffer, caption: (textAfter || '').trim() });
                        aiResponse = aiResponse.replace(videoRegex, '').trim();
                    }
                } catch (innerErr) {
                    console.error('Error while processing attachments from AI response (media/docx/excel):', innerErr);
                }

                await sock.sendMessage(sender, { text: aiResponse });
                conversation.push({ role: "assistant", content: aiResponse });
                saveConversation(sender, conversation);

            } catch (err) {
                console.error('Error processing media:', err);
                await sock.sendMessage(sender, { text: 'Terjadi kesalahan saat memproses file.' });
            }
            return;
        }

        // === Default ChatBot Mode ===
        if (currentMode === 'chatbot') {
            conversation.push({ role: "user", content: userMessage });
            try {
                const response = await fetch('http://localhost:3000/post/rtist', {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: conversation }),
                });
                const data = await response.json();
                let aiResponse = data.result;

                // === NEW: Deteksi & kirim file yang disertakan dalam response AI (DOCX, EXCEL, IMAGE, VIDEO)
                try {
                    // === DOCX
                    const docxMarkdownRegex = /!\[.*?\]\((https:\/\/docx-ai\.exodusai\.biz\.id\/api\/buat\?[^)]+)\)/;
                    const matchDocx = docxMarkdownRegex.exec(aiResponse);
                    if (matchDocx) {
                        const docxUrl = matchDocx[1];
                        await sock.sendMessage(sender, { text: `Oke, gue buatin dulu ya dokumennya sesuai permintaan✨` });
                        const docxBuffer = await fetch(docxUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, {
                            document: docxBuffer,
                            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            fileName: 'hasil.docx'
                        });
                        aiResponse = aiResponse.replace(docxMarkdownRegex, '').trim();
                    }

                    // === EXCEL
                    const excelMarkdownRegex = /!\[.*?\]\((https:\/\/docx-ai\.exodusai\.biz\.id\/api\/buat\/excel\?[^)]+)\)/;
                    const matchExcel = excelMarkdownRegex.exec(aiResponse);
                    if (matchExcel) {
                        const excelUrl = matchExcel[1];
                        await sock.sendMessage(sender, { text: `Oke, gue buatin dulu ya datanya sesuai permintaan ✨` });
                        const excelBuffer = await fetch(excelUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, {
                            document: excelBuffer,
                            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            fileName: 'hasil.xlsx'
                        });
                        aiResponse = aiResponse.replace(excelMarkdownRegex, '').trim();
                    }

                    // === IMAGE
                    const imageRegex = /!\[.*?\]\((http:\/\/localhost:3000\/get\/image-generator\/[^)]+)\)/;
                    const matchImage = imageRegex.exec(aiResponse);
                    if (matchImage) {
                        const imageUrl = matchImage[1];
                        const [textBefore, textAfter] = aiResponse.split(matchImage[0]);
                        if (textBefore && textBefore.trim()) await sock.sendMessage(sender, { text: textBefore.trim() });
                        const imageBuffer = await fetch(imageUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, { image: imageBuffer, caption: (textAfter || '').trim() });
                        aiResponse = aiResponse.replace(imageRegex, '').trim();
                    }

                    // === VIDEO 🎥
                    const videoRegex = /!\[.*?\]\((http:\/\/localhost:3000\/get\/generatevideo\?[^)]+)\)/;
                    const matchVideo = videoRegex.exec(aiResponse);
                    if (matchVideo) {
                        const videoUrl = matchVideo[1];
                        const [textBefore, textAfter] = aiResponse.split(matchVideo[0]);
                        if (textBefore && textBefore.trim()) await sock.sendMessage(sender, { text: textBefore.trim() });
                        const videoBuffer = await fetch(videoUrl).then(res => res.buffer());
                        await sock.sendMessage(sender, { video: videoBuffer, caption: (textAfter || '').trim() });
                        aiResponse = aiResponse.replace(videoRegex, '').trim();
                    }
                } catch (attachErr) {
                    console.error('Error while processing attachments from AI response in chatbot mode:', attachErr);
                }

                aiResponse = aiResponse.replace(/https:\/\/localhost:/gi, 'http://localhost:');
                aiResponse = aiResponse.replace(/https:\/\/pollinations\.ai/gi, 'https://www.exodusai.biz.id').trim();
                aiResponse = fixUrls(aiResponse);
                await sock.sendMessage(sender, { text: aiResponse.trim() });
                conversation.push({ role: "assistant", content: aiResponse });
                saveConversation(sender, conversation);
            } catch (err) {
                console.error('Chatbot error:', err);
                await sock.sendMessage(sender, { text: 'Mohon maaf terjadi kesalahan...' });
            }
        }
    });
}

startBot();

