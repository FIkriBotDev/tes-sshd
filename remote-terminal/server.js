const express = require("express");
const { createServer } = require("http");
const WebSocket = require("ws");
const pty = require("node-pty");
const path = require("path");

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

wss.on("connection", (ws) => {
  const shell = process.env.SHELL || "bash";

  const ptyProcess = pty.spawn("sudo", ["-i"], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  ptyProcess.on("data", (data) => {
    ws.send(data);
  });

  ws.on("message", (msg) => {
    ptyProcess.write(msg);
  });

  ws.on("close", () => {
    ptyProcess.kill();
  });
});

const PORT = 8022;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
