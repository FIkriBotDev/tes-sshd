import express from "express";
import multer from "multer";
import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 5152;

// Setup __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi upload
const upload = multer({ dest: "uploads/" });

// Setup EJS dan folder view
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views-photo2pdf"));

// Setup folder public untuk CSS
app.use(express.static(path.join(__dirname, "public-photo2pdf")));

// Halaman utama
app.get("/", (req, res) => {
  res.render("index", { pdfPath: null });
});

// Endpoint konversi foto ke PDF
app.post("/convert", upload.single("photo"), (req, res) => {
  const photoPath = req.file.path;
  const outputDir = "output";
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const pdfName = `photo-${Date.now()}.pdf`;
  const pdfPath = path.join(outputDir, pdfName);

  // Buat PDF dari gambar
  const doc = new PDFDocument({ autoFirstPage: false });
  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  const img = doc.openImage(photoPath);
  doc.addPage({ size: [img.width, img.height] });
  doc.image(photoPath, 0, 0);
  doc.end();

  // Setelah selesai tulis PDF
  writeStream.on("finish", () => {
    fs.unlinkSync(photoPath); // hapus file gambar sementara
    res.render("index", { pdfPath: `/download/${pdfName}` });
  });
});

// Endpoint download PDF
app.get("/download/:filename", (req, res) => {
  const filePath = path.join("output", req.params.filename);
  res.download(filePath, err => {
    if (!err) fs.unlinkSync(filePath); // hapus PDF setelah didownload
  });
});

// Jalankan server
app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});
