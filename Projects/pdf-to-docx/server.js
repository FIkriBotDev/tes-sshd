const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph } = require("docx");

// ========== FIX UNIVERSAL UNTUK PDF-PARSE ==========
let pdfParse;

try {
  const pdfModule = require("pdf-parse");
  console.log("🔍 Struktur modul pdf-parse:", Object.keys(pdfModule));

  if (typeof pdfModule === "function") {
    pdfParse = pdfModule;
  } else if (typeof pdfModule.default === "function") {
    pdfParse = pdfModule.default;
  } else if (pdfModule.default && typeof pdfModule.default.default === "function") {
    pdfParse = pdfModule.default.default;
  } else if (typeof pdfModule.pdf === "function") {
    pdfParse = pdfModule.pdf;
  } else if (pdfModule.default && typeof pdfModule.default.pdf === "function") {
    pdfParse = pdfModule.default.pdf;
  } else {
    throw new Error("Modul pdf-parse tidak ditemukan fungsi parser-nya (pdfParse).");
  }

  console.log("✅ pdf-parse berhasil dimuat!");
} catch (err) {
  console.error("❌ Gagal memuat modul pdf-parse:", err);
  process.exit(1);
}
// ====================================================

const app = express();
const port = 5153;
const upload = multer({ dest: "uploads/" });

app.use(express.static("public-pdf2docx"));

// Halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public-pdf2docx/index.html"));
});

// Upload dan konversi PDF → DOCX
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);

    const pdfData = await pdfParse(dataBuffer);

    const doc = new Document({
      sections: [
        {
          children: pdfData.text
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => new Paragraph(line)),
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    const outputName = `${Date.now()}_converted.docx`;
    const outputPath = path.join("uploads", outputName);

    fs.writeFileSync(outputPath, docxBuffer);
    fs.unlinkSync(pdfPath);

    res.json({ success: true, downloadUrl: `/download/${outputName}` });
  } catch (error) {
    console.error("❌ ERROR saat konversi:", error);
    res.status(500).json({ success: false, message: "Gagal mengonversi file." });
  }
});

// Endpoint download DOCX
app.get("/download/:filename", (req, res) => {
  const filePath = path.join("uploads", req.params.filename);
  res.download(filePath, (err) => {
    if (!err) fs.unlinkSync(filePath);
  });
});

app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});
