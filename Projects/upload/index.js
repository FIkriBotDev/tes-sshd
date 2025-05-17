const express = require('express');
const multer = require('multer');
const fileType = require('file-type');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 9000;

// Gunakan '/tmp' di Linux/macOS, './tmp' di Windows
const UPLOAD_DIR = process.platform === 'win32' ? path.join(__dirname, 'tmp') : '/tmp';
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const DELETE_DELAY = 10 * 60 * 1000; // 10 menit

// Buat folder jika belum ada
fs.ensureDirSync(UPLOAD_DIR);

// Setup multer dengan memoryStorage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE }
});

// MIME yang dilarang
const FORBIDDEN_TYPES = ['text/html'];

// Endpoint upload
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const buffer = req.file.buffer;
        const detected = await fileType.fromBuffer(buffer);
        const mimeType = detected ? detected.mime : req.file.mimetype;

        console.log('Received:', req.file.originalname);
        console.log('Detected MIME:', mimeType);

        if (FORBIDDEN_TYPES.includes(mimeType)) {
            return res.status(400).json({ error: 'HTML files are not allowed.' });
        }

        const ext = mime.extension(mimeType) || 'bin';
        const filename = `${uuidv4().slice(0, 6)}-${Date.now()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        const fileUrl = `http://localhost:${PORT}/tmp/${filename}`;

        await fs.writeFile(filepath, buffer);
        console.log(`✅ Uploaded: ${filename}`);

        // Jadwalkan penghapusan otomatis
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
