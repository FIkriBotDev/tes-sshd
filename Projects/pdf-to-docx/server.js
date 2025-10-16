import express from "express";
import multer from "multer";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const app = express();
const port = 5153;

// Folder upload & output
const uploadFolder = "uploads";
const outputFolder = "output";
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Endpoint upload PDF → konversi DOCX
app.post("/api/convert", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Tidak ada file yang diunggah!" });

  const inputPath = path.join(uploadFolder, req.file.filename);
  const outputPath = path.join(outputFolder, `${Date.now()}.docx`);
  console.log(`📄 Mengonversi file: ${inputPath} → ${outputPath}`);

  // Jalankan Python converter
  const python = spawn("python3", ["converter.py", inputPath, outputPath]);
  let pythonOutput = "";

  python.stdout.on("data", (data) => {
    const text = data.toString();
    pythonOutput += text;
    console.log("🐍 stdout:", text.trim());
  });

  python.stderr.on("data", (data) => {
    console.error("🐍 stderr:", data.toString());
  });

  python.on("close", (code) => {
    console.log(`🐍 Proses Python selesai dengan kode ${code}`);

    // Cari nama file output sebenarnya dari stdout Python (misal: "output/1760585686293.docx")
    const match = pythonOutput.match(/output\/[\w-]+\.docx/);
    const actualOutputPath = match ? match[0] : outputPath;

    // Cek apakah file hasil benar-benar ada
    if (!fs.existsSync(actualOutputPath)) {
      console.error("❌ File hasil tidak ditemukan:", actualOutputPath);
      return res.status(500).json({ error: "Konversi gagal: file hasil tidak ditemukan." });
    }

    console.log(`✅ Konversi selesai, mengirim file ke user...`);
    res.download(actualOutputPath, (err) => {
      if (err) {
        console.error("❌ Gagal mengirim file:", err);
      } else {
        console.log(`🧹 Menghapus file sementara: ${actualOutputPath}`);
        fs.unlinkSync(actualOutputPath);
      }

      // Hapus file upload asli
      fs.unlink(inputPath, () => {});
    });
  });
});

// Jalankan server
app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});
