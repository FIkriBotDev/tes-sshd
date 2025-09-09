// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { readDB, writeDB } = require('./utils/jsondb');
const { v4: uuidv4 } = require('uuid');
const { DateTime } = require('luxon');
const { startBot, sendWhatsAppMessage, isReady } = require('./bot');

const app = express();
const PORT = process.env.PORT || 6287;

const USERS_DB = path.resolve('./db/database-login-user-reminder-app.json');
const REM_DB = path.resolve('./db/database-schedule-reminder-app.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views-reminder-app'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'rahasia-reminder-app',
  resave: false,
  saveUninitialized: false
}));

// ------------ Middleware ------------
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// ------------ Routes: Auth ------------
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

app.get('/register', (req, res) => res.render('register', { error: null, editing: false }));

app.post('/register', async (req, res) => {
  const { username, phone, password } = req.body;
  if (!username || !phone || !password) 
    return res.render('register', { error: 'Lengkapi semua field', editing: false });
  if (!/^62\d{6,15}$/.test(phone)) 
    return res.render('register', { error: 'Format nomor WA harus 628xxxxxxx', editing: false });

  const users = await readDB(USERS_DB);
  if (users.find(u => u.phone === phone)) 
    return res.render('register', { error: 'Nomor WA sudah terdaftar', editing: false });

  const hashed = await bcrypt.hash(password, 10);

  // Generate OTP 6 digit random
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + (5 * 60 * 1000); // 5 menit berlaku

  // Simpan sementara di session
  req.session.pendingUser = { 
    id: uuidv4(), 
    username, 
    phone, 
    password: hashed, 
    createdAt: new Date().toISOString(), 
    otp, 
    otpExpiry
  };

  // Kirim OTP ke WhatsApp
  if (isReady()) {
    try {
      await sendWhatsAppMessage(phone, `Kode verifikasi Reminder App kamu adalah: *${otp}* (berlaku 5 menit).`);
    } catch (e) {
      console.error("Gagal kirim OTP:", e);
    }
  } else {
    console.log("[BOT NOT READY] OTP untuk", phone, ":", otp);
  }

  res.redirect('/verify-otp');
});

// Halaman verifikasi OTP
app.get('/verify-otp', (req, res) => {
  if (!req.session.pendingUser) return res.redirect('/register');
  res.render('verify-otp', { error: null });
});

app.post('/verify-otp', async (req, res) => {
  if (!req.session.pendingUser) return res.redirect('/register');

  const { otp } = req.body;
  const pending = req.session.pendingUser;

  if (Date.now() > pending.otpExpiry) {
    delete req.session.pendingUser;
    return res.render('verify-otp', { error: 'Kode OTP sudah kedaluwarsa, silakan register ulang.' });
  }

  if (otp === pending.otp) {
    // OTP benar → simpan user ke DB
    const users = await readDB(USERS_DB);
    const newUser = {
      id: pending.id,
      username: pending.username,
      phone: pending.phone,
      password: pending.password,
      createdAt: pending.createdAt
    };
    users.push(newUser);
    await writeDB(USERS_DB, users);

    // login otomatis
    req.session.user = { id: newUser.id, username: newUser.username, phone: newUser.phone };
    delete req.session.pendingUser;
    res.redirect('/dashboard');
  } else {
    res.render('verify-otp', { error: 'Kode OTP salah, coba lagi' });
  }
});

app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.render('login', { error: 'Isi nomor WA dan kata sandi' });
  const users = await readDB(USERS_DB);
  const user = users.find(u => u.phone === phone);
  if (!user) return res.render('login', { error: 'Akun tidak ditemukan' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.render('login', { error: 'Kata sandi salah' });
  req.session.user = { id: user.id, username: user.username, phone: user.phone };
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(()=>res.redirect('/login'));
});

// ------------ Dashboard & CRUD ------------
// (SEMUA kode dashboard, reminder CRUD, settings, scheduler TETAP sama persis)
// ...

// ------------ Scheduler ------------
async function schedulerTick() {
  try {
    const reminders = await readDB(REM_DB);
    if (!Array.isArray(reminders) || reminders.length === 0) return;
    const now = DateTime.now().setZone('Asia/Jakarta');
    const nowMinute = now.startOf('minute');
    const nowISO = nowMinute.toISO();

    for (let rem of reminders) {
      const occurrences = [];
      function pushOccurrence(dt) { occurrences.push(dt); }

      if (rem.repeat === 'none') {
        const dt = DateTime.fromISO(`${rem.date}T${rem.time}`, { zone: 'Asia/Jakarta' });
        if (dt.isValid) pushOccurrence(dt);
      } else if (rem.repeat === 'daily') {
        const dt = DateTime.fromObject(
          { year: now.year, month: now.month, day: now.day, hour: Number(rem.time.split(':')[0]), minute: Number(rem.time.split(':')[1]) }, 
          { zone: 'Asia/Jakarta' }
        );
        pushOccurrence(dt);
      } else if (rem.repeat === 'weekly') {
        const orig = DateTime.fromISO(`${rem.date}T${rem.time}`, { zone: 'Asia/Jakarta' });
        const origWeekday = orig.weekday;
        if (now.weekday === origWeekday) {
          const dt = DateTime.fromObject(
            { year: now.year, month: now.month, day: now.day, hour: Number(rem.time.split(':')[0]), minute: Number(rem.time.split(':')[1]) }, 
            { zone: 'Asia/Jakarta' }
          );
          pushOccurrence(dt);
        }
      } else if (rem.repeat === 'monthly') {
        const orig = DateTime.fromISO(`${rem.date}T${rem.time}`, { zone: 'Asia/Jakarta' });
        const day = orig.day;
        const lastDayOfMonth = DateTime.local(now.year, now.month).setZone('Asia/Jakarta').endOf('month').day;
        if (day <= lastDayOfMonth) {
          const dt = DateTime.fromObject(
            { year: now.year, month: now.month, day, hour: Number(rem.time.split(':')[0]), minute: Number(rem.time.split(':')[1]) }, 
            { zone: 'Asia/Jakarta' }
          );
          pushOccurrence(dt);
        }
      } else if (rem.repeat === 'custom') {
        (rem.customDates || []).forEach(d => {
          const dt = DateTime.fromISO(`${d}T${rem.time}`, { zone: 'Asia/Jakarta' });
          if (dt.isValid) pushOccurrence(dt);
        });
      }

      for (const occ of occurrences) {
        for (const offset of (rem.offsets || [0])) {
          const sendTime = occ.minus({ minutes: offset }).startOf('minute');
          if (sendTime.equals(nowMinute)) {
            rem.sentLog = rem.sentLog || [];
            const key = `${occ.toISO()}|${offset}`;
            if (!rem.sentLog.includes(key)) {
              const phone = rem.userPhone;
              const title = rem.title;
              const hhmm = occ.toFormat('HH:mm');
              const dateStr = occ.toFormat('dd/LL/yyyy');
              const header = offset === 0 ? `Sekarang sudah jam ${hhmm}.` : `Kegiatan "${title}" akan dimulai pada ${hhmm}.`;
              const message = `Halo ${rem.username || ''},\n${header}\nTanggal: ${dateStr}\nWaktu: ${hhmm}\nLokasi: ${rem.location || '-'}\nCatatan: ${rem.description || '-'}`;
              (async ()=>{
                try {
                  if (isReady()) {
                    await sendWhatsAppMessage(phone, message);
                    console.log(`Sent to ${phone} at ${nowISO} (offset ${offset}) -> ${title}`);
                  } else {
                    console.log(`[BOT NOT READY] Would send to ${phone}:`, message);
                  }
                } catch (e) {
                  console.error('Failed send message', e?.message || e);
                }
              })();
              rem.sentLog.push(key);
            }
          }
        }
      }
    }
    await writeDB(REM_DB, reminders);
  } catch (e) {
    console.error('Scheduler error', e);
  }
}
setInterval(schedulerTick, 20 * 1000);

// start WhatsApp bot
startBot().catch(e => console.error('Start bot failed', e));

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
