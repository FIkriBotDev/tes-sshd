// === server.js ===
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fromBuffer = require('file-type').fromBuffer;
const FormData = require('form-data');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const upload = multer();

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

        const urlMatch = response.data.match(/https:\/\/uploader\.nyxs\.pw\/tmp\/[^"\s]+/);
        if (!urlMatch) throw new Error('URL not found in upload response');

        const uploadedUrl = urlMatch[0];
        console.log('Uploaded File URL:', uploadedUrl);
        return uploadedUrl;
    } catch (error) {
        console.error('Error during file upload:', error);
        throw error;
    }
};

// === Gemini Prompt Builder ===
const buildPrompt = () => {
    return `Berikan analisis lengkap dari makanan dalam gambar ini:
- Skor kesehatan keseluruhan (1-5)
- Apakah direkomendasikan atau tidak
- Jelaskan alasannya
- Rincian nutrisi (kalori, protein, karbohidrat, lemak + persentase)
- Vitamin dan mineral
- Analisis bahan atau ingredients
- Alternatif makanan yang lebih sehat
Formatkan semua jawaban dalam format JSON yang valid seperti ini:
{
  "skorKesehatan": 3,
  "direkomendasikanAtauTidak": "Tidak direkomendasikan",
  "alasan": "Makanan ini mengandung banyak gula, dan karbohidrat olahan, tetapi rendah nutrisi penting.",
  "kalori": 350,
  "protein": "4g",
  "proteinPersen": "4% kalori",
  "karbohidrat": "50g",
  "karbohidratPersen": "57% kalori",
  "lemak": "15g",
  "lemakPersen": "39% kalori",
  "vitaminDanMineral": ["Vitamin A", "Vitamin B12", "Riboflavin"],
  "mineral": ["Kalsium", "Besi", "Kalium"],
  "ingredients": "Gula, Tepung, Krim, Pewarna Makanan Merah",
  "alternatif": "Kue rendah gula dengan tepung gandum dan krim yogurt"
}`;
};

// === Analyze Image Endpoint ===
app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        const buffer = req.file.buffer;
        const uploadedUrl = await uploadFile(buffer);

        const prompt = buildPrompt();
        const geminiURL = `https://gemini-api.exoduscloud.my.id/api/gemini-image?text=${encodeURIComponent(prompt)}&url=${encodeURIComponent(uploadedUrl)}`;

        const geminiResponse = await axios.get(geminiURL);

        // Try to extract valid JSON from response
        const jsonMatch = geminiResponse.data.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');

        const jsonData = JSON.parse(jsonMatch[0]);
        res.json(jsonData);
    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ error: 'Image analysis failed' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
