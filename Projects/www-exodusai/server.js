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

// Middleware logging visitor setiap ada request ke "/"
app.get("/", (req, res, next) => {
  let count = parseInt(fs.readFileSync(visitorLogPath, "utf-8").trim()) || 0;
  count += 1;
  fs.writeFileSync(visitorLogPath, count.toString(), "utf-8");
  console.log(`Visitor ke-${count} baru masuk.`);
  next(); // lanjutkan ke static/index.html
});

// Middleware untuk melayani file statis dari folder public-www-exodusai
app.use(express.static(path.join(__dirname, "public-www-exodusai")));

app.listen(PORT, () => {
  console.log(`ExodusAI Web Server running at http://localhost:${PORT}`);
});
