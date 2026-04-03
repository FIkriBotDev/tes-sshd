const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 7026;
const DB_FILE = "database-user.json";
const PUBLIC_DIR = path.join(__dirname, "public");

// Helper baca database
function readUsers() {
  const data = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data || "[]");
}

// Helper simpan database
function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// Server
const server = http.createServer((req, res) => {

  // =====================
  // 🔐 REGISTER (POST)
  // =====================
  if (req.method === "POST" && req.url === "/register") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { username, email, password } = JSON.parse(body);

      // VALIDASI (struktur kontrol)
      if (!username || !email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Semua field wajib diisi!" }));
      }

      const users = readUsers();

      // CEK USER SUDAH ADA
      const userExists = users.find(
        u => u.email === email || u.username === username
      );

      if (userExists) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User sudah terdaftar!" }));
      }

      // SIMPAN USER
      const newUser = { username, email, password };
      users.push(newUser);
      saveUsers(users);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Registrasi berhasil!" }));
    });

    return;
  }

  // =====================
  // 🔐 LOGIN (GET)
  // =====================
  if (req.method === "GET" && req.url === "/login") {
    try {
      const users = readUsers();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(users));

    } catch (error) {
      console.error("Error:", error);

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Server error!" }));
    }

    return;
  }

  // =====================
  // 🌐 STATIC FILE (HTML)
  // =====================
  let filePath = path.join(PUBLIC_DIR, req.url === "/" ? "index.html" : req.url);

  const ext = path.extname(filePath);
  let contentType = "text/html";

  if (ext === ".css") contentType = "text/css";
  if (ext === ".js") contentType = "application/javascript";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("404 Not Found");
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });

});

server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
