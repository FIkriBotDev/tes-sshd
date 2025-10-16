const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParseModule = require("pdf-parse");
const { Document, Packer, Paragraph } = require("docx");

// ✅ Deteksi fungsi parse secara aman (karena beberapa versi pdf-parse berbeda struktur)
const pdfParse =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : typeof pdfParseModule.pdfParse === "function"
    ? pdfParseModule.pdfParse
    : typeof pdfParseModule.default === "function"
    ? pdfParseModule.default
    : null;

if (!pdfParse) {
  console.error("❌ Modul pdf-parse tidak memiliki fungsi parse yang valid.");
  process.exit(1);
}

const app = express();
const port = 5153;

app.use(express.static("public-pdf2docx"));

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);

    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text || "Tidak ada teks yang dapat dibaca dari PDF.";

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [new Paragraph(text)],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const outputName = `${Date.now()}_converted.docx`;
    const outputDir = "converted";
    const outputPath = path.join(outputDir, outputName);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    fs.writeFileSync(outputPath, buffer);
    fs.unlinkSync(pdfPath);

    res.json({
      success: true,
      message: "Konversi berhasil!",
      downloadUrl: `/download/${outputName}`,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengonversi PDF ke DOCX.",
    });
  }
});

app.get("/download/:filename", (req, res) => {
  const filePath = path.join("converted", req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File tidak ditemukan.");
  }

  res.download(filePath, (err) => {
    if (!err) fs.unlinkSync(filePath);
  });
});

app.listen(port, () =>
  console.log(`✅ Server berjalan di http://localhost:${port}`)
);
