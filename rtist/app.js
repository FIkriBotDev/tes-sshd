const express = require('express');
const axios = require('axios');
const cors = require('cors');
const os = require('os-utils');
const fs = require('fs');

const app = express();
const PORT = 3000;
const TOTAL_REQUEST_FILE = './total_request_count.txt';
const LOG_FILE = './log.txt';
const axiosInstance = axios.create({
        timeout: 64000000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Variabel runtime
let startTime = Date.now();
let requestCount = 0;
let totalRequest = 0;

// Variabel untuk DeepSeek
const openRouterApiKey = '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';
const siteUrl = '<your_site_url>'; // optional
const siteName = '<your_site_name>'; // optional

// Fungsi untuk membaca total request dari file
const loadTotalRequest = () => {
  if (fs.existsSync(TOTAL_REQUEST_FILE)) {
    const data = fs.readFileSync(TOTAL_REQUEST_FILE, 'utf-8');
    totalRequest = parseInt(data, 10) || 0;
  } else {
    totalRequest = 0;
  }
};

// Fungsi untuk menyimpan total request ke file
const saveTotalRequest = () => {
  fs.writeFileSync(TOTAL_REQUEST_FILE, totalRequest.toString(), 'utf-8');
};

// Fungsi untuk mencatat log request ke file
const logRequest = (method, url) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const logMessage = `[${timestamp}] ${method} ${url}\n`;
  fs.appendFileSync(LOG_FILE, logMessage, 'utf-8');
};

// Utility untuk menghitung runtime
const getRuntime = () => {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours} hour ${minutes} min ${secs} sec`;
};

// Middleware untuk mencatat semua request
app.use((req, res, next) => {
  requestCount++;
  totalRequest++;
  logRequest(req.method, req.originalUrl); // Catat method dan URL ke log file
  saveTotalRequest(); // Simpan total request ke file
  next();
});

// Rute GET untuk /get/gemini-image
app.get("/get/gemini-image", async (req, res) => {
  try {
    const { text, url } = req.query;

    if (!text || !url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'text' or 'url' query parameter.",
      });
    }

    // Konversi gambar ke base64
    const base64Image = await fetchImageAsBase64(url);

    // Kirim ke Gemini API
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      text,
    ]);

    // Kirim respons JSON
    res.json({
      creator: "Fikri",
      status: true,
      result: result.response.text(),
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      status: false,
      error: "Failed to process the image.",
      message: error.message,
    });
  }
});

// Rute GET untuk /get/openai dengan query parameter
app.get('/get/openai', async (req, res) => {
  try {
    // Ambil query parameter `text`
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        error: "Missing 'text' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.post('https://text.pollinations.ai/', {
      messages: [
        { role: 'user', content: text }
      ]
      //model: 'openai',
      //seed: 42,
      //jsonMode: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    // Kirimkan respons dari API eksternal ke client
    res.status(200).json({
      status: true,
      creator: 'Fikri',
      prompt: text,
      result: response.data
    });
  } catch (error) {
    // Tangani error dan kirimkan ke client
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch data from OpenAI endpoint.',
      message: error.message
    });
  }
});

// Route untuk /get/gemini
app.get('/get/gemini', async (req, res) => {
  try {
    // Ambil query parameter `text`
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        error: "Missing 'text' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/gemini?q=${encodeURIComponent(text)}`, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    // Kirimkan respons dari API eksternal ke client
    res.status(200).json({
      status: true,
      creator: 'Fikri',
      prompt: text,
      result: response.data.result // Ambil hanya field `result` dari respons
    });
  } catch (error) {
    // Tangani error dan kirimkan ke client
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch data from Gemini endpoint.',
      message: error.message
    });
  }
});

// Route untuk /get/blackbox
app.get('/get/blackbox', async (req, res) => {
  try {
    // Ambil query parameter `text`
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        error: "Missing 'text' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/blackbox?q=${encodeURIComponent(text)}`, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    // Kirimkan respons dari API eksternal ke client
    res.status(200).json({
      status: true,
      creator: 'Fikri',
      prompt: text,
      result: response.data.result // Ambil hanya field `result` dari respons
    });
  } catch (error) {
    // Tangani error dan kirimkan ke client
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch data from Blackbox endpoint.',
      message: error.message
    });
  }
});

// Route untuk /get/claude
app.get('/get/claude', async (req, res) => {
  try {
    // Ambil query parameter `text`
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        error: "Missing 'text' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/claude?q=${encodeURIComponent(text)}`, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    // Kirimkan respons dari API eksternal ke client
    res.status(200).json({
      status: true,
      creator: 'Fikri',
      prompt: text,
      result: response.data.result // Ambil hanya field `result` dari respons
    });
  } catch (error) {
    // Tangani error dan kirimkan ke client
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch data from Claude endpoint.',
      message: error.message
    });
  }
});

// Rute GET untuk /get/image-generator/:prompt
app.get('/get/image-generator/:prompt', async (req, res) => {
    try {
        const { prompt } = req.params;
        const { width = 768, height = 384, nologo = true } = req.query; // Default values

        // Encode prompt untuk URL
        const encodedPrompt = encodeURIComponent(prompt);

        // Bangun URL API Pollinations
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=${nologo}`;

        // Ambil gambar dari API Pollinations
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

        // Set header response untuk gambar
        res.setHeader('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch image from Pollinations API.',
            message: error.message
        });
    }
});

// Route untuk /get/text2image
app.get('/get/text2image', async (req, res) => {
  try {
    // Ambil query parameter `prompt`
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        error: "Missing 'prompt' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal untuk mendapatkan gambar PNG
    const response = await axios.get(`https://vapis.my.id/api/txt2imgv1?q=${encodeURIComponent(prompt)}`, {
      headers: {
        'accept': 'image/png'  // Memastikan kita menerima gambar PNG
      },
      responseType: 'arraybuffer'  // Membaca respons sebagai binary data (image)
    });

    // Kirimkan gambar ke client dengan tipe MIME yang sesuai (image/png)
    res.set('Content-Type', 'image/png'); // Set header Content-Type ke image/png
    res.send(response.data); // Kirimkan gambar langsung dalam bentuk buffer
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch image from external API.',
      message: error.message
    });
  }
});

// Route untuk /get/text2img
app.get('/get/text2imagev2', async (req, res) => {
  try {
    // Ambil query parameter `prompt`
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        error: "Missing 'prompt' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal untuk mendapatkan gambar PNG
    const response = await axios.get(`https://vapis.my.id/api/txt2imgv2?q=${encodeURIComponent(prompt)}`, {
      headers: {
        'accept': 'image/png'  // Memastikan kita menerima gambar PNG
      },
      responseType: 'arraybuffer'  // Membaca respons sebagai binary data (image)
    });

    // Kirimkan gambar ke client dengan tipe MIME yang sesuai (image/png)
    res.set('Content-Type', 'image/png'); // Set header Content-Type ke image/png
    res.send(response.data); // Kirimkan gambar langsung dalam bentuk buffer
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch image from external API.',
      message: error.message
    });
  }
});

// Route untuk endpoint OpenRouter (DeepSeek)
app.post('/post/deepseek', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. "messages" harus berupa array.' });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1:free',
        messages
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'http-referer': siteUrl,
          'x-title': siteName,
        }
      }
    );

    console.log('Full Response:', response.data);

    if (!response.data.choices || !response.data.choices.length) {
      return res.status(500).json({ error: 'Invalid response from OpenRouter' });
    }

    res.json({
      status: true,
      creator: 'Fikri',
      result: response.data.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route untuk endpoint openai
app.post('/post/openai', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. "messages" harus berupa array.' });
    }

    const payload = {
      messages,
      model: 'openai',
      seed: 42,
      jsonMode: false,
    };

    const response = await axios.post('https://text.pollinations.ai/', payload, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    res.json({
      status: true,
      creator: 'Fikri',
      result,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route untuk endpoint qwen-coder
app.post('/post/qwen-coder', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. "messages" harus berupa array.' });
    }

    const payload = {
      messages,
      model: 'qwen-coder', // Menggunakan model qwen-coder
      seed: 42,
      jsonMode: false,
    };

    const response = await axios.post('https://text.pollinations.ai/', payload, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    res.json({
      status: true,
      creator: 'Fikri',
      result,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route untuk endpoint llama
app.post('/post/llama', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. "messages" harus berupa array.' });
    }

    const payload = {
      messages,
      model: 'llama', // Menggunakan model Llama 3.3 70B
      seed: 42,
      jsonMode: false,
    };

    const response = await axios.post('https://text.pollinations.ai/', payload, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    res.json({
      status: true,
      creator: 'Fikri',
      result,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route untuk endpoint mistral
app.post('/post/mistral', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. "messages" harus berupa array.' });
    }

    const payload = {
      messages,
      model: 'mistral', // Menggunakan model Mistral Nemo
      seed: 42,
      jsonMode: false,
    };

    const response = await axios.post('https://text.pollinations.ai/', payload, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    res.json({
      status: true,
      creator: 'Fikri',
      result,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route untuk endpoint unity
app.post('/post/rtist', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. "messages" harus berupa array.' });
    }

    const payload = {
      messages,
      model: 'rtist', // Menggunakan model Unity with Mistral Large by Unity AI Lab
      seed: 42,
      jsonMode: false,
    };

    const response = await axios.post('https://text.pollinations.ai/', payload, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    res.json({
      status: true,
      creator: 'Fikri',
      result,
    });
  } catch (error) {
    console.error('Error:', error.message);
 // Simpan error ke file error.txt
    const errorLog = `[${new Date().toISOString()}] ${error.stack || error.message}\n`;
    fs.appendFile('error.txt', errorLog, (err) => {
      if (err) {
        console.error('Failed to write to error.txt:', err.message);
      }
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route untuk midijourney
app.post('/post/midijourney', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format. "messages" harus berupa array.' });
    }

    const payload = {
      messages,
      model: 'midijourney', // Menggunakan model Midijourney musical transformer
      seed: 42,
      jsonMode: false,
    };

    const response = await axios.post('https://text.pollinations.ai/', payload, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;

    res.json({
      status: true,
      creator: 'Fikri',
      result,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Downloader
// Route GET untuk Facebook downloader
app.get('/download/facebook', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(url)}`);

    // Validasi respons dari API eksternal
    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: {
          url: data.url,
          duration_ms: data.duration_ms,
          sd: data.sd,
          hd: data.hd,
          title: data.title,
          thumbnail: data.thumbnail,
        },
      });
    } else {
      // Jika respons dari API tidak valid
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Facebook API.',
      message: error.message,
    });
  }
});


// Route GET untuk YTMP3 Downloader
app.get('/download/ytmp3', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`);

    if (response.data && response.data.status === true && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: {
          title: data.title,
          dl: data.dl,
        },
      });
    } else {
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from YTMP3 API.',
      message: error.message,
    });
  }
});

// Route GET untuk YTMP4 Downloader
app.get('/download/ytmp4', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`);

    if (response.data && response.data.status === true && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: {
          title: data.title,
          dl: data.dl,
        },
      });
    } else {
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from YTMP4 API.',
      message: error.message,
    });
  }
});

// Route GET untuk TikTok Downloader
app.get('/download/tiktok', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`);

    // Validasi respons dari API eksternal
    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: data, // Data langsung dari API Agatz
      });
    } else {
      // Jika respons dari API tidak valid
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from TikTok API.',
      message: error.message,
    });
  }
});

// Route GET untuk Instagram Downloader
app.get('/download/instagram', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`);

    // Validasi respons dari API eksternal
    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: data, // Data langsung dari API Agatz
      });
    } else {
      // Jika respons dari API tidak valid
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Instagram API.',
      message: error.message,
    });
  }
});

// Route GET untuk Terabox Downloader
app.get('/download/terabox', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://api.agatz.xyz/api/terabox?url=${encodeURIComponent(url)}`);

    // Validasi respons dari API eksternal
    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: data, // Data langsung dari API Agatz
      });
    } else {
      // Jika respons dari API tidak valid
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Terabox API.',
      message: error.message,
    });
  }
});

// Route GET untuk Mediafire Downloader
app.get('/download/mediafire', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://vapis.my.id/api/mfdl?url=${encodeURIComponent(url)}`);

    // Validasi respons dari API eksternal
    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: data, // Data langsung dari API Agatz
      });
    } else {
      // Jika respons dari API tidak valid
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Mediafire API.',
      message: error.message,
    });
  }
});

// Route GET untuk Google Drive Downloader
app.get('/download/gdrive', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        error: "Missing 'url' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axiosInstance.get(`https://vapis.my.id/api/gdrive?url=${encodeURIComponent(url)}`);

    // Validasi respons dari API eksternal
    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client dalam format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: data, // Data langsung dari API Agatz
      });
    } else {
      // Jika respons dari API tidak valid
      res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    logErrorDetails(error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Google Drive API.',
      message: error.message,
    });
  }
});

// Search Menu

// Route GET untuk YouTube MP4 Play
app.get('/search/ytmp4play', async (req, res) => {
  try {
    // Ambil query parameter `query`
    const { query } = req.query;

    // Validasi parameter `query`
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://api.agatz.xyz/api/ytplayvid?message=${encodeURIComponent(query)}`);

    // Validasi respons dari API eksternal
    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      // Kirimkan respons ke client
      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data,
      });
    } else {
      // Jika respons dari API tidak valid
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    console.error('Error fetching data from API:', error.message);
    return res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Ytmp4play API.',
      message: error.message,
    });
  }
});

// Route GET untuk YouTube MP3 Play
app.get('/search/ytmp3play', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    const response = await axios.get(`https://api.agatz.xyz/api/ytplay?message=${encodeURIComponent(query)}`);

    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data,
      });
    } else {
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    console.error('Error fetching data from API:', error.message);
    return res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Ytmp3play API.',
      message: error.message,
    });
  }
});

// Route GET untuk YouTube Search
app.get('/search/youtube', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    const response = await axios.get(`https://api.agatz.xyz/api/ytsearch?message=${encodeURIComponent(query)}`);

    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data,
      });
    } else {
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    console.error('Error fetching data from API:', error.message);
    return res.status(500).json({
      status: false,
      error: 'Failed to fetch data from Ytsearch API.',
      message: error.message,
    });
  }
});

// Route GET untuk TikTok Search
app.get('/search/tiktok', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    const response = await axios.get(`https://api.agatz.xyz/api/tiktoksearch?message=${encodeURIComponent(query)}`);

    if (response.data && response.data.status === 200 && response.data.data) {
      const { data } = response.data;

      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data,
      });
    } else {
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    console.error('Error fetching data from API:', error.message);
    return res.status(500).json({
      status: false,
      error: 'Failed to fetch data from TikTok search API.',
      message: error.message,
    });
  }
});

// Route GET untuk Google Search
app.get('/search/google', async (req, res) => {
  try {
    // Ambil query parameter `query`
    const { query } = req.query;

    // Validasi parameter `query`
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/googlev1?q=${encodeURIComponent(query)}`);

    // Validasi respons dari API eksternal
    const apiResponse = response.data;
    if (apiResponse && apiResponse.status && Array.isArray(apiResponse.data)) {
      // Kirimkan respons ke client
      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: apiResponse.data, // Hasil dari API eksternal
      });
    } else {
      // Jika respons dari API tidak valid
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    console.error('Error fetching data from API:', error.message);
    const statusCode = error.response?.status || 500; // Gunakan status dari respons jika ada
    return res.status(statusCode).json({
      status: false,
      error: 'Failed to fetch data from Google Search API.',
      message: error.message,
    });
  }
});

// Route GET untuk Google Image
app.get('/search/gimage', async (req, res) => {
  try {
    // Ambil query parameter `query`
    const { query } = req.query;

    // Validasi parameter `query`
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/gimage?q=${encodeURIComponent(query)}`);

    // Validasi respons dari API eksternal
    const apiResponse = response.data;
    if (apiResponse && apiResponse.status && Array.isArray(apiResponse.data)) {
      // Kirimkan respons ke client
      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: apiResponse.data, // Hasil dari API eksternal
      });
    } else {
      // Jika respons dari API tidak valid
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    console.error('Error fetching data from API:', error.message);
    const statusCode = error.response?.status || 500; // Gunakan status dari respons jika ada
    return res.status(statusCode).json({
      status: false,
      error: 'Failed to fetch data from Google Image Search API.',
      message: error.message,
    });
  }
});

// Route GET untuk Bing Search
app.get('/search/bing', async (req, res) => {
  try {
    // Ambil query parameter `query`
    const { query } = req.query;

    // Validasi parameter `query`
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/bingsrc?q=${encodeURIComponent(query)}`);

    // Validasi respons dari API eksternal
    const apiResponse = response.data;
    if (apiResponse && apiResponse.status && Array.isArray(apiResponse.data)) {
      // Kirimkan respons ke client
      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: apiResponse.data, // Hasil dari API eksternal
      });
    } else {
      // Jika respons dari API tidak valid
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    console.error('Error fetching data from API:', error.message);
    const statusCode = error.response?.status || 500; // Gunakan status dari respons jika ada
    return res.status(statusCode).json({
      status: false,
      error: 'Failed to fetch data from Bing Search API.',
      message: error.message,
    });
  }
});

// Route GET untuk Bing Image Search
app.get('/search/bingimg', async (req, res) => {
  try {
    // Ambil query parameter `query`
    const { query } = req.query;

    // Validasi parameter `query`
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/bingimg?q=${encodeURIComponent(query)}`);

    // Validasi respons dari API eksternal
    const apiResponse = response.data;
    if (apiResponse && apiResponse.status && Array.isArray(apiResponse.data)) {
      // Kirimkan respons ke client
      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: apiResponse.data, // Hasil dari API eksternal
      });
    } else {
      // Jika respons dari API tidak valid
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    console.error('Error fetching data from API:', error.message);
    const statusCode = error.response?.status || 500; // Gunakan status dari respons jika ada
    return res.status(statusCode).json({
      status: false,
      error: 'Failed to fetch data from Bing Image API.',
      message: error.message,
    });
  }
});

// Route GET untuk Pinterest Search
app.get('/search/pinterest', async (req, res) => {
  try {
    // Ambil query parameter `query`
    const { query } = req.query;

    // Validasi parameter `query`
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        status: false,
        error: "Missing or invalid 'query' query parameter.",
      });
    }

    // Kirim permintaan ke API eksternal
    const response = await axios.get(`https://vapis.my.id/api/pinterest?q=${encodeURIComponent(query)}`);

    // Validasi respons dari API eksternal
    const apiResponse = response.data;
    if (apiResponse && apiResponse.status && Array.isArray(apiResponse.data)) {
      // Kirimkan respons ke client
      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: apiResponse.data, // Hasil dari API eksternal
      });
    } else {
      // Jika respons dari API tidak valid
      return res.status(500).json({
        status: false,
        error: 'Invalid response from external API.',
      });
    }
  } catch (error) {
    // Tangani error
    console.error('Error fetching data from API:', error.message);
    const statusCode = error.response?.status || 500; // Gunakan status dari respons jika ada
    return res.status(statusCode).json({
      status: false,
      error: 'Failed to fetch data from Pinterest Search API.',
      message: error.message,
    });
  }
});

// Tools Menu
// Route untuk Tinyurl
app.get('/tools/tinyurl', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "Missing 'url' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal untuk mempersingkat URL
    const response = await axios.get(`https://vapis.my.id/api/tinyurl?url=${encodeURIComponent(url)}`, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (response.data.status) {
      // Kirimkan respons sesuai format yang diinginkan
      res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: response.data.data // URL yang dipersingkat
      });
    } else {
      res.status(500).json({
        error: 'Failed to shorten URL.',
        message: response.data.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch data from TinyURL API.',
      message: error.message
    });
  }
});

// Route untuk Cuaca
app.get('/tools/cuaca', async (req, res) => {
  try {
    // Ambil query parameter `lokasi`
    const { lokasi } = req.query;

    // Periksa apakah query parameter `lokasi` ada
    if (!lokasi) {
      return res.status(400).json({
        error: "Missing 'lokasi' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal untuk mendapatkan data cuaca
    const response = await axios.get(`https://api.siputzx.my.id/api/info/cuaca?q=${encodeURIComponent(lokasi)}`, {
      headers: {
        'accept': 'application/json'
      }
    });

    // Periksa apakah respons dari API berhasil
    if (response.data.status) {
      // Kirimkan respons sesuai format yang diinginkan
      return res.status(200).json({
        status: true,
        creator: 'Fikri',
        data: response.data.data
      });
    } else {
      // Jika respons API tidak berhasil
      return res.status(500).json({
        error: 'Terjadi kesalahan.',
        message: response.data.message || 'Unknown error'
      });
    }
  } catch (error) {
    // Tangani error saat mengakses API eksternal
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch data from Cuaca API.',
      message: error.message
    });
  }
});



// Route untuk sswebpc
app.get('/tools/sswebpc', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "Missing 'url' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal untuk mengambil screenshot
    const apiUrl = `https://api.apiflash.com/v1/urltoimage?access_key=9785a6553eed470ca677235bc5cd3750&wait_until=page_loaded&url=${encodeURIComponent(url)}`;

    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer', // Membaca respons sebagai binary data (image)
    });

    // Kirimkan gambar ke client dengan tipe MIME yang sesuai (image/jpeg)
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data); // Kirimkan gambar langsung dalam bentuk buffer
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch screenshot from API.',
      message: error.message
    });
  }
});

// Endpoint untuk screenshot dengan resolusi khusus (width 411px, height 731px)
app.get('/tools/sswebhp', async (req, res) => {
  try {
    // Ambil query parameter `url`
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "Missing 'url' query parameter."
      });
    }

    // Kirim permintaan ke API eksternal untuk mengambil screenshot dengan resolusi khusus
    const apiUrl = `https://api.apiflash.com/v1/urltoimage?access_key=9785a6553eed470ca677235bc5cd3750&url=${encodeURIComponent(url)}&format=jpeg&width=411&height=731`;

    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer', // Membaca respons sebagai binary data (image)
    });

    // Kirimkan gambar ke client dengan tipe MIME yang sesuai (image/jpeg)
    res.set('Content-Type', 'image/jpeg');
    res.send(response.data); // Kirimkan gambar langsung dalam bentuk buffer
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch screenshot from API.',
      message: error.message
    });
  }
});

// Menampilkan informasi status server di console
const showServerStatus = () => {
  os.cpuUsage((cpuPercent) => {
    console.clear(); // Membersihkan terminal sebelum menampilkan
    const runtime = getRuntime();
    const cpu = `${Math.round(cpuPercent * 100)}%`;
    const ram = `${Math.round((1 - os.freememPercentage()) * 100)}%`;

    // Menyiapkan tabel dengan padding
    console.log(`Server berjalan pada http://localhost:${PORT}`);
    console.log(`
    -----------------------------------------------
    | Server Status: Active                       |
    | Runtime: ${runtime.padEnd(35)}|
    | Cpu: ${cpu.padEnd(39)}|
    | Ram: ${ram.padEnd(39)}|
    -----------------------------------------------
    | Request Count: ${String(requestCount).padEnd(29)}|
    | Total Request: ${String(totalRequest).padEnd(29)}|
    | Log Request disimpan di log.txt             |
    -----------------------------------------------
    `);
  });
};

const logErrorDetails = (error) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const logMessage = `[${timestamp}] Error: ${error.message}\nStack: ${error.stack}\n\n`;

  // Menyimpan log ke dalam file error_log.txt
  fs.appendFileSync('error_log.txt', logMessage, 'utf-8');
};

// Memuat total request dari file saat server dimulai
loadTotalRequest();

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
  setInterval(showServerStatus, 1000); // Memperbarui tampilan setiap 1 detik
});
