import express from "express";
import multer from "multer";
import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
const port = 5152;

// Konfigurasi folder upload
const upload = multer({ dest: "uploads/" });


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views-photo2pdf"));
app.use(express.static("public-photo2pdf"));

// Halaman utama
app.get("/", (req, res) => {
  res.render("index", { pdfPath: null });
});

// Proses upload dan konversi ke PDF
app.post("/convert", upload.single("photo"), (req, res) => {
  const photoPath = req.file.path;
  const outputDir = "output";
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const pdfName = `photo-${Date.now()}.pdf`;
  const pdfPath = path.join(outputDir, pdfName);

  // Membuat PDF
  const doc = new PDFDocument({ autoFirstPage: false });
  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  const img = doc.openImage(photoPath);
  doc.addPage({ size: [img.width, img.height] });
  doc.image(photoPath, 0, 0);
  doc.end();

  writeStream.on("finish", () => {
    fs.unlinkSync(photoPath); // hapus foto sementara
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

app.listen(port, () =>
  console.log(`Server berjalan di http://localhost:${port}`)
);
