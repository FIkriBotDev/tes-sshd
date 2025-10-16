const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { Document, Packer, Paragraph } = require("docx");

const app = express();
const port = 5153;

app.use(express.static("public-pdf2docx"));

const upload = multer({ dest: "uploads/" });

// Upload dan konversi PDF ke DOCX
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);

    // Parse isi teks dari PDF
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text || "Tidak ada teks yang dapat dibaca dari PDF.";

    // Buat file DOCX baru
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

    // Hapus file PDF asli
    fs.unlinkSync(pdfPath);

    // ✅ Kirim respon JSON ke frontend
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

// Endpoint download hasil DOCX
app.get("/download/:filename", (req, res) => {
  const filePath = path.join("converted", req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File tidak ditemukan.");
  }

  res.download(filePath, (err) => {
    if (!err) {
      fs.unlinkSync(filePath); // hapus setelah diunduh
    }
  });
});

app.listen(port, () =>
  console.log(`✅ Server berjalan di http://localhost:${port}`)
);
