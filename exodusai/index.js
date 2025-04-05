const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const fetch = require('node-fetch');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');

// Function to upload files
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

        // Extract URL from HTML response and remove any extraneous characters like quotes
        const urlMatch = response.data.match(/https:\/\/uploader\.nyxs\.pw\/tmp\/[^\s]+/);
        if (!urlMatch) throw new Error('URL not found in upload response');

        const uploadedUrl = urlMatch[0].replace(/"/g, '');  // Remove any quotes around the URL
        console.log('Uploaded File URL:', uploadedUrl);
        return uploadedUrl;
    } catch (error) {
        console.error('Error during file upload:', error);
        throw error;
    }
};

// Function to load conversation from a file
function loadConversation(fileName) {
    const data = fs.readFileSync(fileName);
    const parsedData = JSON.parse(data);
    return parsedData.default_conversation || [];
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
    headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--deterministic-fetch', // stabilkan network untuk pengiriman gambar
      '--disable-features=VizDisplayCompositor', // mematikan compositor GPU
    ],
    },
});

let userConversations = {};
let userModes = {};

// Function to get conversation for a user
function getConversation(userId) {
    if (!userConversations[userId]) {
        const fileName = userId === '6287863293173@c.us' ? 'dika.json' :
                         userId === '6287769811262@c.us' ? 'fikri.json' :
                         userId === '6287824613268@c.us' ? 'say.json' :
                         userId === '6282269995370@c.us' ? 'sis.json' :
                         userId === '6282142719548@c.us' ? 'fu.json' :
                         userId === '62895351640508@c.us' ? 'april.json' :
                         userId === '6285271848176@c.us' ? 'nuni.json' : 'database.json';
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

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('AI is Ready!');
});

client.on('message', async (message) => {
    const userId = message.from;
    const userMessage = message.body.trim().toLowerCase();

    let conversation = getConversation(userId);
    const currentMode = getMode(userId);

    // Handle mode switching
    if (userMessage === '/mode') {
        message.reply("*Berikut adalah mode yang tersedia di ExodusAI*\n\n=> AI ChatBot [/mode chatbot]\n=> AI Image Generator [/mode image-generator]");
        return;
    }

    if (userMessage === '/mode chatbot') {
        setMode(userId, 'chatbot');
        message.reply('Mode berhasil diubah ke AI ChatBot.');
        return;
    }

    if (userMessage === '/mode image-generator') {
        setMode(userId, 'image-generator');
        message.reply('Mode berhasil diubah ke AI Image Generator.');
        return;
    }

    // Handle media files (audio, video, image)
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            const buffer = Buffer.from(media.data, 'base64');
            const uploadedFileUrl = await uploadFile(buffer);

            // Default prompt based on media type
            let geminiPrompt = '';
            if (message.type === 'audio') {
                geminiPrompt = userMessage || 'dengarkan audio ini';  // Use user message or default prompt
            } else if (message.type === 'video') {
                geminiPrompt = userMessage || 'video apa ini';  // Use user message or default prompt
            } else if (message.type === 'image') {
                geminiPrompt = userMessage || 'lihatlah gambar ini';  // Use user message or default prompt
            } else {
                message.reply('Jenis file tidak didukung untuk saat ini.');
                return;
            }

            // Send request to Gemini API
            //const geminiApiUrl = `https://gemini-api-5k0h.onrender.com/gemini/image?q=${encodeURIComponent(geminiPrompt)}&url=${encodeURIComponent(uploadedFileUrl)}`;
//            const geminiApiUrl = `https://api.nyxs.pw/ai/gemini-img?text=${encodeURIComponent(geminiPrompt)}&url=${encodeURIComponent(uploadedFileUrl)}`;
            const geminiApiUrl = `https://ytsummarize-ai.exoduscloud.my.id/api/gemini-image?text=${encodeURIComponent(geminiPrompt)}&url=${encodeURIComponent(uploadedFileUrl)}`;
            console.log('Gemini API URL:', geminiApiUrl);

            const geminiResponse = await fetch(geminiApiUrl).then((res) => res.json());
            console.log('Gemini API Response:', geminiResponse);

            if (!geminiResponse.status || !geminiResponse.result) {
                message.reply('Maaf, file tidak dapat dianalisis. Pastikan file yang dikirim valid.');
                return;
            }

            const geminiResult = geminiResponse.result;

            // Add conversation for chatbot integration
            conversation.push({
                role: "user",
                content: `Berikut ini adalah text dari gemini result: "${geminiResult}". Sekarang kirimkan gemini result tersebut ke user dengan menggunakan bahasa kamu (bahasa gaul seperti yang kamu gunakan) dan tambahkan sedikit kata kata biar lebih kreatif. dan kirimkan text nya saja tanpa perlu semacam kamu kirim "Ini adalah hasilnya" cukup kirimkan text yang kamu ubah saja.`,
//                content: `Berikut ini adalah text dari gemini result: ${geminiResult}. Sekarang kirimkan gemini result tersebut ke user dengan menggunakan bahasa kamu (bahasa gaul seperti yang kamu gunakan) dan tambahkan sedikit kata kata terkait dengan gemini result tersebut agar lebih kreatif lagi.`,
//                content: `User mengirim ${message.type}, di dalam file tersebut merupakan ${geminiResult}. Sekarang jelaskan ke user file tersebut, gunakan bahasa gaul bukan bahasa yang digunakan pada text tersebut, hindari menggunakan bahasa seperti yang ada pada text tersebut dan gunakanlah bahasa yang seperti bahasa yang lu gunakan.`,
            });

            // Send request to ExodusCloud Chatbot API
            const apiUrl = 'https://restapi.exoduscloud.my.id/post/rtist';
            const requestBody = { messages: conversation };

            const chatbotResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const chatbotData = await chatbotResponse.json();
            console.log('Chatbot API Response:', chatbotData);

            if (chatbotData.status && chatbotData.result && !chatbotData.result.error) {
                const aiResponse = chatbotData.result;
                message.reply(aiResponse.trim());

                conversation.push({
                    role: "assistant",
                    content: aiResponse,
                });
                saveConversation(userId, conversation);
            } else {
                message.reply('Maaf, ExodusAI sedang dalam pengembangan. Coba lagi nanti, ya!');
            }
        } catch (error) {
            console.error('Error processing media:', error);
            message.reply('Terjadi kesalahan saat memproses file. Coba lagi nanti.');
        }
        return;
    }

    if (currentMode === 'chatbot') {
        conversation.push({
            role: "user",
            content: userMessage,
        });

        const apiUrl = 'https://restapi.exoduscloud.my.id/post/rtist';
        const requestBody = { messages: conversation };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (data.status && data.result && !data.result.error) {
                let aiResponse = data.result;

                // Search for image in the AI response
                const imageRegex = /!\[.*?\]\((https?:\/\/[^\s]+)\)/g;
                let match = imageRegex.exec(aiResponse);

                if (match) {
                    const imageUrl = match[1]; // Image URL
                    const [textBeforeImage, textAfterImage] = aiResponse.split(match[0]);

                    // Notify user before sending the image (optional)
                    if (textBeforeImage.trim()) {
                        await message.reply("Oke bro! Tunggu ya gue lagi buatin gambar nya.✨");
                    }

                    // Get image from the URL
                    const imageBuffer = await fetch(imageUrl).then(res => res.buffer());
                    const media = new MessageMedia('image/jpeg', imageBuffer.toString('base64'), 'image.jpg');

                    // Send image to the user
                    await client.sendMessage(userId, media);

                    // Send text after the image (if available)
                    if (textAfterImage.trim()) {
                        await message.reply(textAfterImage.trim());
                    }
                } else {
                    // If no image, send the text response directly
                    message.reply(aiResponse.trim());
                }

                conversation.push({
                    role: "assistant",
                    content: aiResponse,
                });
                saveConversation(userId, conversation);
            } else {
                message.reply('Mohon maaf terjadi kesalahan...');
            }
        } catch (error) {
            console.error('Error:', error);
            message.reply('Mohon maaf terjadi kesalahan...');
        }
    }
});

client.initialize();
