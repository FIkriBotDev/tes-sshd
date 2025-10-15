import express from "express";
import multer from "multer";
import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";

const app = express();
const port = 5000;

// Konfigurasi folder upload
const upload = multer({ dest: "uploads/" });

// Middleware
app.set("view engine", "ejs");
app.use(express.static("public"));

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
