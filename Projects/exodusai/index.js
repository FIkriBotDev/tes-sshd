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

        const response = await axios.post('https://uploader.jadikelas.tech/upload', form, {
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
ex    }
    return userConversations[userId];
}
function reloadChatbotConversation(userId) {
    const fileName =
        userId === '6287863293173@s.whatsapp.net' ? 'dika.json' :
        userId === '6287824613268@s.whatsapp.net' ? 'say.json' :
        userId === '6283140117292@s.whatsapp.net' ? 'cece.json' :
        userId === '6282269995370@s.whatsapp.net' ? 'sis.json' :
        userId === '6282142719548@s.whatsapp.net' ? 'fu.json' :
        userId === '62895351640508@s.whatsapp.net' ? 'april.json' :
        userId === '6283897921042@s.whatsapp.net' ? 's.json' :
        userId === '6285271848176@s.whatsapp.net' ? 'nuni.json' :
        '/home/runner/work/tes-sshd/tes-sshd/database.json';

    userConversations[userId] = loadConversation(fileName);
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
                      "=> AI Search [/mode websearch]\n" +
                      "=> AI Voice [/mode voice]"
            });
            return;
        }

        // === Mode Switch
        if (userMessage === '/mode chatbot') {
            setMode(sender, 'chatbot');
            reloadChatbotConversation(sender);
            await sock.sendMessage(sender, { text: 'Mode berhasil diubah ke AI ChatBot.' });
            return;
        }
        if (userMessage === '/mode image-generator') {
            setMode(sender, 'image-generator');
            await sock.sendMessage(sender, { text: 'Mode berhasil diubah ke AI Image Generator.' });
            return;
        }
        if (userMessage === '/mode ringkasmateri') {
            setMode(sender, 'ringkasmateri');
            await sock.sendMessage(sender, { text: '📄 Mode *AI Ringkas Materi* aktif.\n\nSilakan kirim file PDF atau DOCX untuk diringkas.' });   
            return;
        }
        if (userMessage === '/mode voice') {
            setMode(sender, 'voice');
            await sock.sendMessage(sender, {
                text: '🎙️ Mode *Voice AI* aktif.\n\nKirim VN (voice note), nanti gue jawab pakai suara juga.'
            });
        }
        if (userMessage === '/mode websearch') {
            setMode(sender, 'websearch');
            userConversations[sender] = [];
            await sock.sendMessage(sender, { text: '🌐 Mode *Web Search* aktif.\n\nKetikkan apa yang ingin kamu cari.\nContoh:\n• Berita hari ini\n• Loker cybersecurity 2026\n\nUntuk kembali ke mode chatbot, ketik *`/mode chatbot`*.'
            });
            return;
        }
        if (userMessage === '/mode photoeditor') {
            setMode(sender, 'photoeditor');
            await sock.sendMessage(sender, {
             text: '✅ Mode berhasil diubah ke *AI Photo Editor (Image-to-Image)*.\n\nKirim gambar beserta deskripsi editan yang diinginkan untuk mulai mengedit.\n\nUntuk kembali ke mode chatbot, ketik *`/mode chatbot`*.'
        });
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

        // === Mode AI Ringkas Materi
        if (
    currentMode === 'ringkasmateri' &&
    m.message.documentMessage &&
    (
        m.message.documentMessage.mimetype === "application/pdf" ||
        m.message.documentMessage.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
) {
    try {
        await sock.sendMessage(sender, {
            text: '📄 Dokumen diterima, membaca isi materi...'
        });

        // Download file
        const buffer = await downloadMediaMessage(
            m,
            'buffer',
            {},
            { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
        );

        const ext =
            m.message.documentMessage.mimetype === "application/pdf"
                ? ".pdf"
                : ".docx";

        // Simpan file sementara
        const tempPath = path.join(os.tmpdir(), `ringkas_${Date.now()}${ext}`);
        fs.writeFileSync(tempPath, buffer);

        // Jalankan Python extractor
        const py = spawn("python3", ["extract.py", tempPath]);

        let stdout = "";
        let stderr = "";

        py.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        py.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        py.on("close", async () => {
            fs.unlinkSync(tempPath);

            if (stderr) {
                console.error("[RingkasMateri] Python error:", stderr);
                await sock.sendMessage(sender, {
                    text: '❌ Gagal membaca dokumen.'
                });
                return;
            }

            let parsed;
            try {
                parsed = JSON.parse(stdout);
            } catch (err) {
                console.error("[RingkasMateri] JSON parse error:", stdout);
                await sock.sendMessage(sender, {
                    text: '❌ Format dokumen tidak valid.'
                });
                return;
            }

            if (parsed.status !== "success" || !parsed.text) {
                await sock.sendMessage(sender, {
                    text: '❌ Dokumen kosong atau tidak dapat diproses.'
                });
                return;
            }

            await sock.sendMessage(sender, {
                text: '🧠 Sedang meringkas materi, tunggu sebentar...'
            });

            // Kirim ke RTIST
            const rtistRes = await fetch(
                "http://localhost:3000/post/rtist",
                {
                    method: "POST",
                    headers: {
                        "accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messages: [
                            {
                                role: "user",
                                content:
`Ringkaslah materi berikut menjadi poin-poin penting.
Gunakan bahasa Indonesia yang rapi dan mudah dipahami.

Materi:
${parsed.text}`
                            }
                        ]
                    })
                }
            );

            const rtistData = await rtistRes.json();
            const summary = rtistData.result;

            if (!summary) {
                await sock.sendMessage(sender, {
                    text: '❌ AI gagal meringkas materi.'
                });
                return;
            }

            // Kirim hasil ringkasan (TEXT, BUKAN JSON)
            await sock.sendMessage(sender, {
                text: `📘 *Ringkasan Materi*\n\n${summary}`
            });
        });

    } catch (err) {
        console.error("[RingkasMateri] Error:", err);
        await sock.sendMessage(sender, {
            text: '❌ Terjadi kesalahan saat memproses dokumen.'
        });
    }
    return;
}

// === VOICE MODE ===
if (currentMode === 'voice' && m.message.audioMessage) {
    try {
        await sock.sendMessage(sender, { text: '🎧 Lagi dengerin suara lo...' });

        // 1. download audio dari WA
        const buffer = await downloadMediaMessage(
            m,
            'buffer',
            {},
            { logger: P({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
        );

        // 2. upload ke server kamu
        const uploadedUrl = await uploadFile(buffer);

        // 3. download lagi sebagai file (biar bisa kirim ke STT)
        const audioFile = await axios.get(uploadedUrl, { responseType: 'arraybuffer' });

        // 4. kirim ke STT (Pollinations)
        const form = new FormData();
        form.append('file', Buffer.from(audioFile.data), 'audio.wav');
        form.append('model', 'whisper-large-v3');
        form.append('response_format', 'json');

        const sttRes = await axios.post(
            'https://gen.pollinations.ai/v1/audio/transcriptions',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: 'Bearer sk_x4Ooo55xH8WozPTwFvBMjB5mozB2t3NB', // GANTI TOKEN
                }
            }
        );

        const userText = sttRes.data.text;
        console.log('Transcribed:', userText);

        if (!userText) {
            await sock.sendMessage(sender, { text: '❌ Gagal membaca suara.' });
            return;
        }

        await sock.sendMessage(sender, { text: `🧠 "${userText}"` });

        // 5. ambil conversation
        let conversation = getConversation(sender);
        conversation.push({ role: "user", content: userText });

        // 6. kirim ke text generation (Pollinations POST biar memory)
        const aiRes = await axios.post(
            'https://gen.pollinations.ai/v1/chat/completions',
            {
                model: 'openai', // atau model lain
                messages: conversation
            },
            {
                headers: {
                    Authorization: 'Bearer sk_RM9sUErPNlaj7kFenSIMljnIVvAyssUk', // GANTI TOKEN
                    'Content-Type': 'application/json'
                }
            }
        );

        let aiText = aiRes.data.choices[0].message.content;
        console.log('AI:', aiText);

        conversation.push({ role: "assistant", content: aiText });
        saveConversation(sender, conversation);

        await sock.sendMessage(sender, { text: '🔊 Lagi ngomong nih...' });

        // 7. generate audio (TTS)
        const ttsUrl = `https://gen.pollinations.ai/audio/${encodeURIComponent(aiText)}`;

        const ttsAudio = await axios.get(ttsUrl, {
            responseType: 'arraybuffer',
            headers: {
                Accept: 'audio/mpeg',
                Authorization: 'Bearer sk_x4Ooo55xH8WozPTwFvBMjB5mozB2t3NB' // GANTI TOKEN
            }
        });

        // 8. kirim ke user
        await sock.sendMessage(sender, {
            audio: Buffer.from(ttsAudio.data),
            mimetype: 'audio/mpeg',
            ptt: false // biar jadi VN
        });

    } catch (err) {
        console.error('[VOICE MODE ERROR]', err);
        await sock.sendMessage(sender, {
            text: '❌ Error di voice mode.'
        });
    }
    return;
}

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


// Mode Web Search
const WEBSEARCH_SYSTEM = {
    role: "system",
    content: `
Kamu adalah AI Web Search Assistant.
Tugas kamu:
- Mencari informasi terbaru dari internet
- Menjawab berdasarkan hasil web search
- Jika user berkata "yang lain", "yang terbaru", "yang 2026",
  kamu HARUS melanjutkan konteks pencarian sebelumnya.
- Jangan mengarang.
- Jawaban harus rapi dan informatif.
`
};

if (currentMode === 'websearch') {
    try {
        let conversation = getConversation(sender);

        // inject system prompt sekali saja
        if (conversation.length === 0) {
            conversation.push(WEBSEARCH_SYSTEM);
        }

        conversation.push({
            role: "user",
            content: userMessage
        });

        await sock.sendMessage(sender, { text: '🔎 Lagi gue cariin di web...' });

        const response = await axios.post(
            'https://gen.pollinations.ai/v1/chat/completions',
            {
                model: 'gemini-search',
                messages: conversation
            },
            {
                headers: {
                    Authorization: 'Bearer sk_SETrd7HFtdLzVVlBUGDCoFPg2taPkjCv',
                    'Content-Type': 'application/json'
                }
            }
        );

        const msg = response.data.choices[0].message;

        // === Ambil text utama
        let answer = '';
        if (msg.content_blocks) {
            answer = msg.content_blocks
                .filter(b => b.type === 'text')
                .map(b => b.text)
                .join('\n');
        } else {
            answer = msg.content || '';
        }

        // === Ambil sumber URL
        const sources =
            response.data.choices[0].groundingMetadata?.groundingChunks || [];

        let sourceText = '';
        if (sources.length > 0) {
            sourceText = '\n\n*Link:*\n';
            sources.forEach(s => {
                const cleanUrl = s.web.uri.replace(
                    'https://vertexaisearch.cloud.google.com/grounding-api-redirect/',
                    'https://aisearch.exodusai.biz.id/'
                );
            // jobstreet.com:
            // https://aisearch.exodusai.biz.id/
            //
            // situslain.com:
            //    sourceText += `${cleanUrl} (${s.web.domain})\n`;
                sourceText += `${s.web.domain}:\n${cleanUrl}\n\n`;
            });
        }

        const finalText = answer + sourceText;

        await sock.sendMessage(sender, { text: finalText });

        // simpan context
        conversation.push({
            role: "assistant",
            content: answer
        });
        saveConversation(sender, conversation);

    } catch (err) {
        console.error('[WebSearch Error]', err);
        await sock.sendMessage(sender, {
            text: '❌ Gagal melakukan pencarian web.'
        });
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

