const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph } = require("docx");

// === FIX untuk berbagai versi pdf-parse ===
let pdfParse;
try {
  const pdfModule = require("pdf-parse");
  if (typeof pdfModule === "function") {
    pdfParse = pdfModule;
  } else if (typeof pdfModule.pdf === "function") {
    pdfParse = pdfModule.pdf;
  } else if (typeof pdfModule.default === "function") {
    pdfParse = pdfModule.default;
  } else {
    throw new Error("Modul pdf-parse tidak ditemukan fungsi parse-nya.");
  }
} catch (err) {
  console.error("❌ Gagal memuat modul pdf-parse:", err);
  process.exit(1);
}
// ==========================================

const app = express();
const port = 5153;
const upload = multer({ dest: "uploads/" });

app.use(express.static("public-pdf2docx"));

// Halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public-pdf2docx/index.html"));
});

// Upload dan convert PDF ke DOCX
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);

    // Parse PDF → ambil teks
    const pdfData = await pdfParse(dataBuffer);

    // Buat file DOCX dari teks hasil PDF
    const doc = new Document({
      sections: [
        {
          children: pdfData.text
            .split("\n")
            .map((line) => new Paragraph(line.trim())),
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    const outputName = `${Date.now()}_converted.docx`;
    const outputPath = path.join("uploads", outputName);

    fs.writeFileSync(outputPath, docxBuffer);

    // Hapus file PDF asli
    fs.unlinkSync(pdfPath);

    // Kirim link download
    res.json({ success: true, downloadUrl: `/download/${outputName}` });
  } catch (error) {
    console.error("❌ ERROR saat konversi:", error);
    res.status(500).json({ success: false, message: "Gagal mengonversi file." });
  }
});

// Endpoint untuk download hasil DOCX
app.get("/download/:filename", (req, res) => {
  const filePath = path.join("uploads", req.params.filename);
  res.download(filePath, (err) => {
    if (!err) fs.unlinkSync(filePath);
  });
});

app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});
