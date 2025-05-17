const express = require('express');
const multer = require('multer');
const fileType = require('file-type');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 5000;
const UPLOAD_DIR = '/tmp';
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const DELETE_DELAY = 10 * 60 * 1000; // 10 menit

fs.ensureDirSync(UPLOAD_DIR);
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE }
});

const FORBIDDEN_TYPES = ['text/html'];

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const buffer = req.file.buffer;
        const detected = await fileType.fromBuffer(buffer);
        const mimeType = detected ? detected.mime : req.file.mimetype;

        if (FORBIDDEN_TYPES.includes(mimeType)) {
            return res.status(400).json({ error: 'HTML files are not allowed.' });
        }

        const ext = mime.extension(mimeType) || 'bin';
        const filename = `${uuidv4().slice(0, 6)}-${Date.now()}.${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);
        const fileUrl = `http://localhost:${PORT}/tmp/${filename}`;

        await fs.writeFile(filepath, buffer);
        console.log(`File uploaded: ${filename}`);

        // Auto-delete in 10 minutes
        setTimeout(() => {
            fs.remove(filepath).then(() => {
                console.log(`File deleted: ${filename}`);
            });
        }, DELETE_DELAY);

        res.json({ url: fileUrl });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Serve uploaded files
app.use('/tmp', express.static(UPLOAD_DIR));

app.listen(PORT, () => {
    console.log(`Uploader running at http://localhost:${PORT}`);
});
