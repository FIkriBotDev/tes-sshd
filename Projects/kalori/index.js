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

// === Error Logger ===
const logErrorToFile = (error) => {
    const logMessage = `[${new Date().toISOString()}] ${error.stack || error.message || error}\n\n`;
    fs.appendFileSync('error_log_food_analyzer.txt', logMessage);
    console.error(error);
};

// === Upload file function ===
const uploadFile = async (buffer) => {
    try {
        const { ext } = await fileTypeFromBuffer(buffer);
        if (!ext) throw new Error('Could not determine file type from buffer');

        let form = new FormData();
        form.append('file', buffer, 'tmp.' + ext);

        const response = await axios.post('https://uploader.exoduscloud.my.id/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        console.log('🛰 Upload response data:', response.data);

        const uploadedUrl = response.data.url;
        if (!uploadedUrl) throw new Error('URL not found in upload response');

        return uploadedUrl;
    } catch (error) {
        logErrorToFile(error);
        throw error;
    }
};

// === Prompt Builder ===
const buildPrompt = () => `
Beri saya analisis lengkap tentang makanan pada gambar ini:

1. Deskripsi atau skor kesehatan keseluruhan
2. Apakah direkomendasikan atau tidak dan alasannya
3. Rincian nutrisi:
   - kalori
   - takaran saji (dalam gram)
   - jumlah sajian (jika tampak)
   - protein & persentase terhadap kalori
   - karbohidrat total, gula, serat & persentase terhadap kalori
   - lemak total, lemak jenuh, lemak tak jenuh & persentase terhadap kalori
   - kolesterol
   - natrium (garam)
4. Vitamin dan mineral yang terkandung
5. Perbandingan terhadap AKG (Angka Kecukupan Gizi)
6. Indikator Risiko Kesehatan (misalnya: tinggi gula, lemak berlebih, dsb)
7. Perkiraan waktu pencernaan atau kenyang
8. Rekomendasi frekuensi konsumsi
9. Analisis bahan/ingredients
10. Tips penyajian yang lebih sehat
11. Alternatif makanan yang lebih sehat

Balas dalam format JSON:
{
  "skorKesehatan": {
    "direkomendasikanAtauTidak": "...",
    "alasan": "..."
  },
  "rincianNutrisi": {
    "takaranSaji": "gram",
    "jumlahSajian": "jika tersedia",
    "kalori": 0,
    "protein": "25g",
    "proteinPersen": "16.67%",
    "karbohidrat": "70g",
    "karbohidratPersen": "46.67%",
    "gula": "12g",
    "serat": "5g",
    "lemakTotal": "20g",
    "lemakJenuh": "7g",
    "lemakTakJenuh": "13g",
    "lemakPersen": "30%",
    "kolesterol": "60mg",
    "natrium": "780mg",
    "vitaminDanMineral": ["Vitamin A", "Vitamin C", "Zat Besi", "Kalsium", ...]
  },
  "perbandinganAKG": [
    { "nama": "Kalori", "persen": "30%" },
    { "nama": "Gula", "persen": "50%" }
  ],
  "risikoKesehatan": {
    "Gula": "tinggi",
    "Lemak": "sedang"
  },
  "waktuKenyang": "3 jam",
  "frekuensiKonsumsi": "Tidak lebih dari 1x/minggu",
  "ingredients": ["...", "..."],
  "tipsSehat": ["...", "..."],
  "alternatif": ["...", "..."]
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
            const responseText = response.data.result;
            console.log('🔍 Raw AI response:\n', responseText);

            const jsonBlockMatch = responseText.match(/```json\n([\s\S]+?)\n```/);
            if (!jsonBlockMatch) {
                throw new Error('JSON block not found in AI response');
            }

            const jsonString = jsonBlockMatch[1];
            console.log('🧩 Extracted JSON string:\n', jsonString);

            aiJson = JSON.parse(jsonString);
        } catch (e) {
            logErrorToFile(e);
            return res.status(500).json({ error: 'Failed to parse AI response as JSON', raw: response.data });
        }

        res.json(aiJson);
    } catch (err) {
        logErrorToFile(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === Serve Frontend ===
app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}`);
});
