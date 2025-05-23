const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const pty = require("node-pty");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", function connection(ws) {
  const shell = process.env.SHELL || "bash";

  // Buat shell tanpa password sudo
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  // Kirim output terminal ke client
  ptyProcess.on("data", function (data) {
    ws.send(data);
  });

  // Terima input dari client
  ws.on("message", function (msg) {
    ptyProcess.write(msg);
  });

  ws.on("close", function () {
    ptyProcess.kill();
  });
});

const PORT = 8022;
server.listen(PORT, () => {
  console.log(`✅ Terminal tersedia di http://localhost:${PORT}`);
});
