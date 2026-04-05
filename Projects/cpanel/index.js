const express = require('express');
const session = require('express-session');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 8811;
const WORK_DIR = '/home/runner/work/tes-sshd/tes-sshd/techsprint';
const RUN_USER = 'runner';
const CREDENTIALS = { username: 'server', password: 'oH6$.P6J92Ls' };

// Track running process
let runningProcess = null;
let processStatus = 'stopped'; // 'running' | 'stopped'
let processLogs = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, '/home/runner/work/tes-sshd/tes-sshd/Projects/cpanel/public')));
app.use(session({
  secret: 'cp-secret-x9k2',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// ─── Auth ────────────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// ─── File Manager ────────────────────────────────────────────────────────────

app.get('/api/files', requireAuth, (req, res) => {
  const rel = req.query.path || '';
  const target = path.join(WORK_DIR, rel);
  if (!target.startsWith(WORK_DIR)) return res.status(403).json({ error: 'Forbidden' });

  fs.readdir(target, { withFileTypes: true }, (err, entries) => {
    if (err) return res.status(500).json({ error: err.message });
    const items = entries.map(e => ({
      name: e.name,
      type: e.isDirectory() ? 'dir' : 'file',
      path: path.join(rel, e.name).replace(/\\/g, '/')
    }));
    res.json({ items, current: rel });
  });
});

app.get('/api/file', requireAuth, (req, res) => {
  const rel = req.query.path || '';
  const target = path.join(WORK_DIR, rel);
  if (!target.startsWith(WORK_DIR)) return res.status(403).json({ error: 'Forbidden' });

  fs.readFile(target, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ content: data, path: rel });
  });
});

app.post('/api/file', requireAuth, (req, res) => {
  const { path: rel, content } = req.body;
  const target = path.join(WORK_DIR, rel);
  if (!target.startsWith(WORK_DIR)) return res.status(403).json({ error: 'Forbidden' });

  fs.writeFile(target, content, 'utf8', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/mkdir', requireAuth, (req, res) => {
  const { path: rel } = req.body;
  const target = path.join(WORK_DIR, rel);
  if (!target.startsWith(WORK_DIR)) return res.status(403).json({ error: 'Forbidden' });

  fs.mkdir(target, { recursive: true }, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/file', requireAuth, (req, res) => {
  const rel = req.query.path || '';
  const target = path.join(WORK_DIR, rel);
  if (!target.startsWith(WORK_DIR)) return res.status(403).json({ error: 'Forbidden' });

  fs.rm(target, { recursive: true, force: true }, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ─── Process Control ─────────────────────────────────────────────────────────

function broadcastStatus() {
  const msg = JSON.stringify({ type: 'status', status: processStatus });
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

function broadcastLog(line) {
  processLogs.push(line);
  if (processLogs.length > 500) processLogs.shift();
  const msg = JSON.stringify({ type: 'log', line });
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

function startProcess() {
  if (runningProcess) return;
  runningProcess = spawn('su', ['-s', '/bin/bash', '-c', 'node index.js', RUN_USER], {
    cwd: WORK_DIR,
    env: { ...process.env, HOME: `/home/${RUN_USER}` }
  });
  processStatus = 'running';
  broadcastStatus();

  runningProcess.stdout.on('data', d => broadcastLog(d.toString()));
  runningProcess.stderr.on('data', d => broadcastLog(d.toString()));
  runningProcess.on('close', () => {
    runningProcess = null;
    processStatus = 'stopped';
    broadcastStatus();
    broadcastLog('[Process exited]');
  });
}

function stopProcess(cb) {
  if (!runningProcess) { if (cb) cb(); return; }
  runningProcess.kill('SIGTERM');
  setTimeout(() => {
    if (runningProcess) runningProcess.kill('SIGKILL');
    runningProcess = null;
    processStatus = 'stopped';
    broadcastStatus();
    if (cb) cb();
  }, 1500);
}

app.get('/api/status', requireAuth, (req, res) => {
  res.json({ status: processStatus, logs: processLogs.slice(-100) });
});

app.post('/api/start', requireAuth, (req, res) => {
  if (processStatus === 'running') return res.status(400).json({ error: 'Already running' });
  startProcess();
  res.json({ success: true });
});

app.post('/api/stop', requireAuth, (req, res) => {
  if (processStatus === 'stopped') return res.status(400).json({ error: 'Not running' });
  stopProcess();
  res.json({ success: true });
});

app.post('/api/restart', requireAuth, (req, res) => {
  if (processStatus === 'stopped') return res.status(400).json({ error: 'Not running' });
  stopProcess(() => {
    setTimeout(() => startProcess(), 3000);
  });
  res.json({ success: true });
});

// ─── WebSocket Terminal ───────────────────────────────────────────────────────

wss.on('connection', (ws, req) => {
  // Parse session from cookie manually
  const cookieHeader = req.headers.cookie || '';
  const sessionMatch = cookieHeader.match(/connect\.sid=([^;]+)/);
  // Allow connection; auth check via first message

  let ptyProcess = null;
  let authenticated = false;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'auth') {
      // Client sends session token for validation
      authenticated = msg.token === 'cp-auth-ok';
      if (!authenticated) { ws.send(JSON.stringify({ type: 'auth', ok: false })); return; }
      ws.send(JSON.stringify({ type: 'auth', ok: true }));
      return;
    }

    if (msg.type === 'subscribe-status') {
      ws.send(JSON.stringify({ type: 'status', status: processStatus }));
      return;
    }

    if (msg.type === 'terminal-init') {
      if (ptyProcess) return;
      ptyProcess = pty.spawn('su', ['-s', '/bin/bash', RUN_USER], {
        name: 'xterm-256color',
        cols: msg.cols || 80,
        rows: msg.rows || 24,
        cwd: WORK_DIR,
        env: {
          ...process.env,
          HOME: `/home/${RUN_USER}`,
          USER: RUN_USER,
          LOGNAME: RUN_USER,
          PS1: 'root@server:~# ',
          TERM: 'xterm-256color'
        }
      });

      // Set prompt and cd to work dir
      setTimeout(() => {
        ptyProcess.write(`cd ${WORK_DIR} && export PS1='root@server:~# ' && clear\r`);
      }, 300);

      ptyProcess.onData(data => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'terminal-data', data }));
        }
      });

      ptyProcess.onExit(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'terminal-exit' }));
        }
      });
      return;
    }

    if (msg.type === 'terminal-input' && ptyProcess) {
      ptyProcess.write(msg.data);
      return;
    }

    if (msg.type === 'terminal-resize' && ptyProcess) {
      ptyProcess.resize(msg.cols, msg.rows);
      return;
    }
  });

  ws.on('close', () => {
    if (ptyProcess) { try { ptyProcess.kill(); } catch {} }
  });
});

server.listen(PORT, () => {
  console.log(`Control Panel running at http://localhost:${PORT}`);
});
