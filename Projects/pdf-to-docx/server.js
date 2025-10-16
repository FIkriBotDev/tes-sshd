import express from "express";
import multer from "multer";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

const app = express();
const __dirname = path.resolve();

// Konfigurasi multer
const upload = multer({ dest: "uploads/" });

// pastikan folder "output" sudah ada
if (!fs.existsSync("output")) fs.mkdirSync("output");

app.use(express.static("public-pdf2docx"));

app.post("/convert", upload.single("pdfFile"), (req, res) => {
  if (!req.file) return res.status(400).send("Tidak ada file PDF yang diupload.");

  const pdfPath = req.file.path;
  const outputDocx = `output/${Date.now()}.docx`;

  console.log(`📄 Mengonversi file: ${pdfPath} → ${outputDocx}`);

  const python = spawn("python3", ["convert.py", pdfPath, outputDocx]);

  // tampilkan output python ke terminal untuk debug
  python.stdout.on("data", (data) => console.log(`🐍 stdout: ${data}`));
  python.stderr.on("data", (data) => console.error(`🐍 stderr: ${data}`));

  python.on("close", (code) => {
    if (code === 0) {
      console.log("✅ Konversi selesai, mengirim file ke user...");
      res.download(outputDocx, "converted.docx", (err) => {
        fs.unlinkSync(pdfPath);
        fs.unlinkSync(outputDocx);
      });
    } else {
      console.error("❌ Python process exited dengan kode:", code);
      res.status(500).send("Gagal mengonversi PDF ke DOCX.");
    }
  });
});

app.listen(5153, () =>
  console.log("✅ Server berjalan di http://localhost:5153")
);
