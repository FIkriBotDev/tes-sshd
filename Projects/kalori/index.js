// backend/index.js
import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const app = express();
const port = 5000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.static('public'));

// === Upload file function ===
const uploadFile = async (buffer) => {
    try {
        const { ext } = await fileTypeFromBuffer(buffer);
        if (!ext) throw new Error('Could not determine file type from buffer');

        let form = new FormData();
        form.append('file', buffer, 'tmp.' + ext);

        const response = await axios.post('https://uploader.nyxs.pw/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        const urlMatch = response.data.match(/https:\/\/uploader\.nyxs\.pw\/tmp\/[^\"]+/);
        if (!urlMatch) throw new Error('URL not found in upload response');

        const uploadedUrl = urlMatch[0].replace(/"/g, '');
        return uploadedUrl;
    } catch (error) {
        console.error('Error during file upload:', error);
        throw error;
    }
};

// === Prompt Builder ===
const buildPrompt = () => `
Beri saya analisis lengkap tentang makanan pada gambar ini:
- Skor kesehatan keseluruhan
- Apakah direkomendasikan atau tidak dan alasannya
- Rincian nutrisi (kalori, protein, karbohidrat, lemak & persentase masing-masing terhadap total kalori)
- Vitamin dan mineral yang terkandung
- Analisis bahan/ingredients
- Alternatif makanan yang lebih sehat
Balas dalam format JSON:
{
  "skorKesehatan": {"direkomendasikanAtauTidak": "...", "alasan": "..."},
  "rincianNutrisi": {
    "kalori": ..., "protein": "...", "proteinPersen": "...",
    "karbohidrat": "...", "karbohidratPersen": "...",
    "gemuk": "...", "gemukPersen": "...",
    "vitaminDanMineral": [...], "mineral": [...]
  },
  "ingredients": [...],
  "alternatif": [...]
}
`;

// === POST /analyze ===
app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        const fileBuffer = req.file.buffer;
        const uploadedUrl = await uploadFile(fileBuffer);

        const geminiPrompt = buildPrompt();
        const geminiUrl = `https://gemini-api.exoduscloud.my.id/api/gemini-image?text=${encodeURIComponent(geminiPrompt)}&url=${encodeURIComponent(uploadedUrl)}`;

        const response = await axios.get(geminiUrl);

        let aiJson;
        try {
            aiJson = JSON.parse(response.data);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to parse AI response as JSON', raw: response.data });
        }

        res.json(aiJson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === Serve Frontend ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`);
});
