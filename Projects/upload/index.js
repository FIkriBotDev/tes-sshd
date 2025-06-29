import express from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname di ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi
const app = express();
const PORT = 9000;
const UPLOAD_DIR = path.join(__dirname, 'tmp'); // ✅ fixed agar ke folder lokal tmp
const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const DELETE_DELAY = 10 * 60 * 1000; // 10 menit
const FORBIDDEN_TYPES = ['text/html'];

// Pastikan folder upload ada
fs.ensureDirSync(UPLOAD_DIR);

// Setup Multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: MAX_SIZE } });

// Endpoint upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = req.file.buffer;
    const detected = await fileTypeFromBuffer(buffer);
    const mimeType = detected?.mime || req.file.mimetype;

    console.log(`Received: ${req.file.originalname}`);
    console.log(`Detected MIME: ${mimeType}`);

    if (FORBIDDEN_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'HTML files are not allowed.' });
    }

    const ext = mime.extension(mimeType) || 'bin';
    const filename = `${uuidv4().slice(0, 6)}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const fileUrl = `https://uploader.exoduscloud.my.id/tmp/${filename}`;

    await fs.writeFile(filepath, buffer);
    console.log(`✅ Uploaded: ${filename}`);
    console.log(`📁 Saved to: ${filepath}`);

    // Hapus file setelah 10 menit
    setTimeout(() => {
      fs.remove(filepath)
        .then(() => console.log(`🗑️ Deleted: ${filename}`))
        .catch(err => console.error('Delete failed:', err));
    }, DELETE_DELAY);

    res.json({ url: fileUrl });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({
      error: 'Upload failed',
      detail: err.message,
      stack: err.stack
    });
  }
});

// Serve file dari folder tmp
app.use('/tmp', express.static(UPLOAD_DIR));

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Uploader running at http://localhost:${PORT}`);
});
