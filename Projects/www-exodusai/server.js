// server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = 9128;

// Middleware untuk melayani file statis dari folder public-www-exodusai
app.use(express.static(path.join(__dirname, "public-www-exodusai")));

// Route default -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public-www-exodusai", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ExodusAI Web Server running at http://localhost:${PORT}`);
});
