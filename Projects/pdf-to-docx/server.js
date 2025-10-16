import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import pkg from "pdf-parse";
import { Document, Packer, Paragraph } from "docx";

const app = express();
const port = 5153;

// Deteksi fungsi parser (untuk pdf-parse versi lama dan baru)
let pdfParse =
  typeof pkg === "function"
    ? pkg
    : typeof pkg.default === "function"
    ? pkg.default
    : pkg.PDFParse || pkg.parse;

if (typeof pdfParse !== "function") {
  console.error("❌ Gagal menemukan fungsi parser pdf-parse.");
  process.exit(1);
}

// Middleware
app.use(express.static("public"));

// Setup multer untuk upload
const upload = multer({ dest: "uploads/" });

// Endpoint konversi PDF ke DOCX
app.post("/convert", upload.single("pdfFile"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);

    const data = await pdfParse(dataBuffer);
    const text = data.text || "Tidak ada teks terbaca dari PDF ini.";

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

    // Hapus file PDF asli
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
