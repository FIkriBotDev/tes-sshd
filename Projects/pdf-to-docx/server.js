import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { Document, Packer, Paragraph } from "docx";

const app = express();
const port = 5153;
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

// Halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

// Upload dan convert PDF ke DOCX
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);

    // Buat dokumen DOCX baru
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: pdfData.text,
            }),
          ],
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    const outputName = `${Date.now()}_converted.docx`;
    const outputPath = path.join("uploads", outputName);

    fs.writeFileSync(outputPath, docxBuffer);

    // Hapus file PDF setelah convert
    fs.unlinkSync(pdfPath);

    // Kirim link download
    res.json({ success: true, downloadUrl: `/download/${outputName}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengonversi file." });
  }
});

// Endpoint download hasil DOCX
app.get("/download/:filename", (req, res) => {
  const filePath = path.join("uploads", req.params.filename);
  res.download(filePath, (err) => {
    if (!err) fs.unlinkSync(filePath);
  });
});

app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});
