const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { Document, Packer, Paragraph } = require("docx");

const app = express();
const port = 5153;

// Middleware
app.use(express.static("public-pdf2docx"));

// Setup multer untuk upload
const upload = multer({ dest: "uploads/" });

// Endpoint konversi PDF ke DOCX
app.post("/convert", upload.single("pdfFile"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);

    const data = await pdfParse(dataBuffer);
    const text = data.text || "Tidak ada teks yang dapat dibaca dari PDF.";

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [new Paragraph(text)],
        },
      ],
    });

    const outputFile = `converted_${Date.now()}.docx`;
    const outputPath = path.join("converted", outputFile);

    if (!fs.existsSync("converted")) fs.mkdirSync("converted");

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    // Hapus file PDF asli setelah selesai
    fs.unlinkSync(pdfPath);

    res.download(outputPath, "converted.docx", (err) => {
      if (!err) fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error("❌ Terjadi error:", err);
    res.status(500).send("Gagal mengonversi PDF ke DOCX.");
  }
});

app.listen(port, () =>
  console.log(`✅ Server berjalan di http://localhost:${port}`)
);
