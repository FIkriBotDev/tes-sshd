// Simple VPS Control Panel (Node.js + Express + WebSocket + xterm.js)
// WARNING: This is a simplified version for learning. Secure before production.

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8811;

const BASE_DIR = "/home/runner/work/tes-sshd/tes-sshd/techsprint/";
let processRef = null;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));

// Auth
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'server' && password === 'oH6$.P6J92Ls') {
    req.session.auth = true;
    return res.json({ success: true });
  }
  res.json({ success: false });
});

function auth(req, res, next) {
  if (!req.session.auth) return res.status(401).send('Unauthorized');
  next();
}

// File list
app.get('/files', auth, (req, res) => {
  const files = fs.readdirSync(BASE_DIR);
  res.json(files);
});

// Read file
app.get('/file', auth, (req, res) => {
  const filePath = path.join(BASE_DIR, req.query.name);
  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ content });
});

// Save file
app.post('/file', auth, (req, res) => {
  const filePath = path.join(BASE_DIR, req.body.name);
  fs.writeFileSync(filePath, req.body.content);
  res.json({ success: true });
});

// Start app
app.post('/start', auth, (req, res) => {
  if (processRef) return res.json({ status: 'already running' });
  processRef = spawn('node', ['index.js'], { cwd: BASE_DIR });
  res.json({ status: 'started' });
});

// Stop app
app.post('/stop', auth, (req, res) => {
  if (processRef) {
    processRef.kill();
    processRef = null;
  }
  res.json({ status: 'stopped' });
});

// Restart
app.post('/restart', auth, (req, res) => {
  if (processRef) processRef.kill();
  setTimeout(() => {
    processRef = spawn('node', ['index.js'], { cwd: BASE_DIR });
  }, 3000);
  res.json({ status: 'restarted' });
});

// Status
app.get('/status', auth, (req, res) => {
  res.json({ running: !!processRef });
});

app.listen(PORT, () => console.log(`Panel running on http://localhost:${PORT}`));

/* ================= FRONTEND (public/index.html) ================= */

/*
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-green-400">

<div id="login" class="flex items-center justify-center h-screen">
  <div>
    <input id="user" placeholder="Username" class="block mb-2 text-black">
    <input id="pass" type="password" placeholder="Password" class="block mb-2 text-black">
    <button onclick="login()" class="bg-green-500 px-4 py-2">Login</button>
  </div>
</div>

<div id="panel" class="hidden p-4">
  <h1 class="text-xl mb-4">Control Panel</h1>

  <button onclick="start()">Start</button>
  <button onclick="stop()">Stop</button>
  <button onclick="restart()">Restart</button>

  <div id="files" class="mt-4"></div>
  <textarea id="editor" class="w-full h-40 text-black"></textarea>
  <button onclick="save()">Save</button>
</div>

<script>
async function login() {
  const res = await fetch('/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({username: user.value, password: pass.value})
  });
  const data = await res.json();
  if (data.success) {
    login.style.display='none';
    panel.style.display='block';
    loadFiles();
  }
}

async function loadFiles() {
  const res = await fetch('/files');
  const files = await res.json();
  filesDiv.innerHTML = files.map(f=>`<div onclick="openFile('${f}')">${f}</div>`).join('');
}

async function openFile(name) {
  window.current = name;
  const res = await fetch('/file?name='+name);
  const data = await res.json();
  editor.value = data.content;
}

async function save() {
  await fetch('/file', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({name: current, content: editor.value})
  });
}

async function start(){await fetch('/start',{method:'POST'})}
async function stop(){await fetch('/stop',{method:'POST'})}
async function restart(){await fetch('/restart',{method:'POST'})}
</script>

</body>
</html>
*/
