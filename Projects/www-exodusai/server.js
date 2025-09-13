// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 9128;

// Lokasi file log visitor
const visitorLogPath = path.join(__dirname, "visitor_count_www_exodusai.txt");

// Inisialisasi file log jika belum ada
if (!fs.existsSync(visitorLogPath)) {
  fs.writeFileSync(visitorLogPath, "0", "utf-8");
}

// Middleware untuk melayani file statis
app.use(express.static(path.join(__dirname, "public-www-exodusai")));

// Route default -> index.html
app.get("/", (req, res) => {
  // Baca jumlah visitor saat ini
  let count = parseInt(fs.readFileSync(visitorLogPath, "utf-8")) || 0;
  count += 1;

  // Tulis kembali ke file
  fs.writeFileSync(visitorLogPath, count.toString(), "utf-8");

  console.log(`Visitor ke-${count} baru masuk.`);

  // Kirim index.html
  res.sendFile(path.join(__dirname, "public-www-exodusai", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ExodusAI Web Server running at http://localhost:${PORT}`);
});
