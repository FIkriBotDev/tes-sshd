// === app.js (Node.js Express Server) ===
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 2100;

app.use(cors());
app.use(express.static('public_nutriscan_chatbot'));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint untuk upload gambar dan parsing nutrisi
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const response = await axios.post(
      'https://api.exodusai.my.id/nutriscan',
      {
        image: buffer.toString('base64'),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengenali makanan' });
  }
});

// Endpoint untuk chatbot AI
app.post('/chat', async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    const result = await axios.post(
      'https://rtist-api.exoduscloud.my.id/post/rtist',
      { prompt: userPrompt },
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json(result.data);
  } catch (e) {
    res.status(500).json({ error: 'Gagal menghubungi AI' });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
