// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 9123;

// Lokasi file log visitor
const visitorLogPath = path.join(__dirname, "visitor-count.txt");

// Inisialisasi file log jika belum ada
if (!fs.existsSync(visitorLogPath)) {
  fs.writeFileSync(visitorLogPath, "0", "utf-8");
}

// Middleware logging visitor khusus untuk request ke root "/"
app.get("/", (req, res, next) => {
  try {
    let count = parseInt(fs.readFileSync(visitorLogPath, "utf-8").trim()) || 0;
    count += 1;
    fs.writeFileSync(visitorLogPath, count.toString(), "utf-8");
    console.log(`Visitor ke-${count} baru masuk.`);
  } catch (err) {
    console.error("Gagal memperbarui file log visitor:", err);
  }
  next(); // Lanjutkan ke middleware static untuk merender index.html
});

// Middleware untuk melayani file statis (HTML, CSS, JS, Gambar) dari folder "public_html"
app.use(express.static(path.join(__dirname, "public_html")));

// Jalankan server
app.listen(PORT, () => {
  console.log(`Web Server running at http://localhost:${PORT}`);
});