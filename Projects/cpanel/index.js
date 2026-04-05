// ================= BACKEND: server.js =================

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 8811;

const BASE_DIR = "/home/runner/work/tes-sshd/tes-sshd/techsprint/";
let proc = null;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true
}));

// AUTH
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'server' && password === 'oH6$.P6J92Ls') {
    req.session.auth = true;
    return res.json({ success: true });
  }
  res.json({ success: false });
});

const auth = (req, res, next) => {
  if (!req.session.auth) return res.status(401).send('Unauthorized');
  next();
};

// FILES
app.get('/files', auth, (req, res) => {
  res.json(fs.readdirSync(BASE_DIR));
});

app.get('/file', auth, (req, res) => {
  const file = path.join(BASE_DIR, req.query.name);
  res.json({ content: fs.readFileSync(file, 'utf-8') });
});

app.post('/file', auth, (req, res) => {
  const file = path.join(BASE_DIR, req.body.name);
  fs.writeFileSync(file, req.body.content);
  res.json({ success: true });
});

// PROCESS CONTROL
app.get('/status', auth, (req, res) => {
  res.json({ running: !!proc });
});

app.post('/start', auth, (req, res) => {
  if (proc) return res.json({ msg: 'already running' });
  proc = spawn('node', ['index.js'], { cwd: BASE_DIR });
  res.json({ msg: 'started' });
});

app.post('/stop', auth, (req, res) => {
  if (proc) {
    proc.kill();
    proc = null;
  }
  res.json({ msg: 'stopped' });
});

app.post('/restart', auth, (req, res) => {
  if (proc) proc.kill();
  setTimeout(() => {
    proc = spawn('node', ['index.js'], { cwd: BASE_DIR });
  }, 3000);
  res.json({ msg: 'restarted' });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));


// ================= FRONTEND: public/index.html =================

/*
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<script src="https://cdn.tailwindcss.com"></script>
<title>Control Panel</title>
</head>

<body class="bg-gray-900 text-white">

<div id="loginPage" class="flex h-screen items-center justify-center">
  <div class="bg-gray-800 p-6 rounded-xl w-80">
    <h1 class="text-xl mb-4">Login</h1>
    <input id="user" class="w-full mb-2 p-2 text-black" placeholder="Username" />
    <input id="pass" type="password" class="w-full mb-4 p-2 text-black" placeholder="Password" />
    <button onclick="login()" class="w-full bg-green-500 p-2 rounded">Login</button>
  </div>
</div>

<div id="dashboard" class="hidden flex h-screen">

  <!-- Sidebar -->
  <div class="w-64 bg-gray-800 p-4">
    <h2 class="mb-4 font-bold">Files</h2>
    <div id="fileList"></div>
  </div>

  <!-- Main -->
  <div class="flex-1 p-4 flex flex-col">

    <!-- Controls -->
    <div class="mb-4">
      <button onclick="start()" class="bg-green-600 px-3 py-1 mr-2">Start</button>
      <button onclick="stop()" class="bg-red-600 px-3 py-1 mr-2">Stop</button>
      <button onclick="restart()" class="bg-yellow-600 px-3 py-1">Restart</button>
      <span id="status" class="ml-4"></span>
    </div>

    <!-- Editor -->
    <textarea id="editor" class="flex-1 bg-black text-green-400 p-2"></textarea>
    <button onclick="save()" class="bg-blue-600 p-2 mt-2">Save</button>

  </div>
</div>

<script>
let currentFile = "";

async function login() {
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user.value, password: pass.value })
  });
  const data = await res.json();
  if (data.success) {
    loginPage.style.display = 'none';
    dashboard.style.display = 'flex';
    loadFiles();
    checkStatus();
  }
}

async function loadFiles() {
  const res = await fetch('/files');
  const files = await res.json();
  fileList.innerHTML = files.map(f => `<div class='cursor-pointer' onclick="openFile('${f}')">${f}</div>`).join('');
}

async function openFile(name) {
  currentFile = name;
  const res = await fetch('/file?name=' + name);
  const data = await res.json();
  editor.value = data.content;
}

async function save() {
  await fetch('/file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: currentFile, content: editor.value })
  });
  alert('Saved');
}

async function start() {
  await fetch('/start', { method: 'POST' });
  checkStatus();
}

async function stop() {
  await fetch('/stop', { method: 'POST' });
  checkStatus();
}

async function restart() {
  await fetch('/restart', { method: 'POST' });
  checkStatus();
}

async function checkStatus() {
  const res = await fetch('/status');
  const data = await res.json();
  status.innerText = data.running ? 'Running' : 'Stopped';
}

setInterval(checkStatus, 3000);
</script>

</body>
</html>
*/
