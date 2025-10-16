import express from "express";
import multer from "multer";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

const app = express();
const __dirname = path.resolve();

// Konfigurasi multer
const upload = multer({ dest: "uploads/" });

// Pastikan folder "output" sudah ada
if (!fs.existsSync("output")) fs.mkdirSync("output");

app.use(express.static("public-pdf2docx"));

app.post("/convert", upload.single("pdfFile"), (req, res) => {
  if (!req.file) return res.status(400).send("Tidak ada file PDF yang diupload.");

  const pdfPath = req.file.path;
  const outputDocx = `output/${Date.now()}.docx`;

  console.log(`📄 Mengonversi file: ${pdfPath} → ${outputDocx}`);

  const python = spawn("python3", ["convert.py", pdfPath, outputDocx]);

  let pythonOutput = "";

  // tampilkan output python ke terminal untuk debug
  python.stdout.on("data", (data) => {
    const text = data.toString();
    pythonOutput += text;
    console.log(`🐍 stdout: ${text}`);
  });

  python.stderr.on("data", (data) => console.error(`🐍 stderr: ${data}`));

  python.on("close", (code) => {
    if (code === 0) {
      // deteksi nama file output sebenarnya dari stdout Python
      const match = pythonOutput.match(/output\/[\w.-]+\.docx/);
      const actualOutput = match ? match[0] : outputDocx;

      console.log("✅ Konversi selesai, mengirim file ke user...");

      // pastikan file hasil benar-benar ada
      if (!fs.existsSync(actualOutput)) {
        console.error("❌ File hasil tidak ditemukan:", actualOutput);
        fs.unlinkSync(pdfPath);
        return res.status(500).send("File hasil konversi tidak ditemukan.");
      }

      res.download(actualOutput, "converted.docx", (err) => {
        if (err) console.error("❌ Gagal mengirim file:", err);

        // hapus file input & output setelah pengiriman selesai
        try {
          if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
          if (fs.existsSync(actualOutput)) fs.unlinkSync(actualOutput);
        } catch (e) {
          console.error("⚠️ Gagal menghapus file sementara:", e);
        }
      });
    } else {
      console.error("❌ Python process exited dengan kode:", code);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      res.status(500).send("Gagal mengonversi PDF ke DOCX.");
    }
  });
});

app.listen(5153, () => console.log("✅ Server berjalan di http://localhost:5153"));
