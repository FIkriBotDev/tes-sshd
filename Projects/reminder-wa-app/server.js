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
app.use('/public', express.static(path.join(__dirname, 'public-reminder-app')));
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

app.get('/register', (req, res) =>
  res.render('register', { error: null, editing: false, user: null })
);

app.post('/register', async (req, res) => {
  const { username, phone, password } = req.body;
  if (!username || !phone || !password) {
    return res.render('register', { error: 'Lengkapi semua field', editing: false, user: null });
  }
  // validate phone format: must start with 62 and digits only
  if (!/^62\d{6,15}$/.test(phone)) {
    return res.render('register', { error: 'Format nomor WA harus 628xxxxxxx', editing: false, user: null });
  }

  const users = await readDB(USERS_DB);
  if (users.find(u => u.phone === phone)) {
    return res.render('register', { error: 'Nomor WA sudah terdaftar', editing: false, user: null });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), username, phone, password: hashed, createdAt: new Date().toISOString() };
  users.push(newUser);
  await writeDB(USERS_DB, users);
  req.session.user = { id: newUser.id, username: newUser.username, phone: newUser.phone };
  res.redirect('/dashboard');
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
  req.session.destroy(() => res.redirect('/login'));
});

// ------------ Dashboard & CRUD ------------
app.get('/dashboard', requireLogin, async (req, res) => {
  const reminders = await readDB(REM_DB);
  const myRem = reminders.filter(r => r.userId === req.session.user.id);
  res.render('dashboard', { reminders: myRem, tz: 'WIB (Asia/Jakarta)' });
});

app.get('/reminder/create', requireLogin, (req, res) =>
  res.render('create', { error: null })
);

app.post('/reminder/create', requireLogin, async (req, res) => {
  try {
    const { title, date, time, offsets, description, location, category, priority, repeat, customDates } = req.body;
    if (!title || !date || !time) return res.render('create', { error: 'Judul, tanggal, dan jam wajib diisi' });

    const offsetsArr = (offsets || '').split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
    if (!offsetsArr.includes(0)) offsetsArr.push(0);
    offsetsArr.sort((a, b) => b - a);

    const reminders = await readDB(REM_DB);
    const newRem = {
      id: uuidv4(),
      userId: req.session.user.id,
      username: req.session.user.username,
      userPhone: req.session.user.phone,
      title,
      date,
      time,
      offsets: offsetsArr,
      description: description || '',
      location: location || '',
      category: category || '',
      priority: priority || 'sedang',
      repeat: repeat || 'none',
      customDates: customDates ? customDates.split(',').map(s => s.trim()).filter(Boolean) : [],
      createdAt: new Date().toISOString(),
      sentLog: []
    };
    reminders.push(newRem);
    await writeDB(REM_DB, reminders);
    res.redirect('/dashboard');
  } catch (e) {
    console.error(e);
    res.render('create', { error: 'Gagal buat reminder' });
  }
});

app.get('/reminder/edit/:id', requireLogin, async (req, res) => {
  const reminders = await readDB(REM_DB);
  const rem = reminders.find(r => r.id === req.params.id && r.userId === req.session.user.id);
  if (!rem) return res.redirect('/dashboard');
  res.render('edit', { reminder: rem, error: null });
});

app.post('/reminder/edit/:id', requireLogin, async (req, res) => {
  const reminders = await readDB(REM_DB);
  const idx = reminders.findIndex(r => r.id === req.params.id && r.userId === req.session.user.id);
  if (idx === -1) return res.redirect('/dashboard');
  const { title, date, time, offsets, description, location, category, priority, repeat, customDates } = req.body;
  const offsetsArr = (offsets || '').split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
  if (!offsetsArr.includes(0)) offsetsArr.push(0);
  reminders[idx] = {
    ...reminders[idx],
    title, date, time,
    offsets: offsetsArr,
    description: description || '',
    location: location || '',
    category: category || '',
    priority: priority || 'sedang',
    repeat: repeat || 'none',
    customDates: customDates ? customDates.split(',').map(s => s.trim()).filter(Boolean) : []
  };
  await writeDB(REM_DB, reminders);
  res.redirect('/dashboard');
});

app.post('/reminder/delete/:id', requireLogin, async (req, res) => {
  let reminders = await readDB(REM_DB);
  reminders = reminders.filter(r => !(r.id === req.params.id && r.userId === req.session.user.id));
  await writeDB(REM_DB, reminders);
  res.redirect('/dashboard');
});

// ------------ Settings: update phone or username ------------
app.get('/settings', requireLogin, async (req, res) => {
  const users = await readDB(USERS_DB);
  const user = users.find(u => u.id === req.session.user.id);
  res.render('register', { error: null, editing: true, user });
});

app.post('/settings', requireLogin, async (req, res) => {
  const { username, phone } = req.body;
  if (!username || !phone) return res.send('Lengkapi');
  if (!/^62\d{6,15}$/.test(phone)) return res.send('Format WA harus 628xxxxxxx');
  const users = await readDB(USERS_DB);
  const idx = users.findIndex(u => u.id === req.session.user.id);
  if (idx === -1) return res.redirect('/login');
  users[idx].username = username;
  users[idx].phone = phone;
  await writeDB(USERS_DB, users);
  req.session.user.username = username;
  req.session.user.phone = phone;
  const reminders = await readDB(REM_DB);
  reminders.forEach(r => { if (r.userId === req.session.user.id) r.userPhone = phone; });
  await writeDB(REM_DB, reminders);
  res.redirect('/dashboard');
});

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
      const baseDate = rem.date;
      const time = rem.time;

      function pushOccurrence(dt) { occurrences.push(dt); }

      if (rem.repeat === 'none') {
        const dt = DateTime.fromISO(`${rem.date}T${rem.time}`, { zone: 'Asia/Jakarta' });
        if (dt.isValid) pushOccurrence(dt);
      } else if (rem.repeat === 'daily') {
        const dt = DateTime.fromObject({ year: now.year, month: now.month, day: now.day, hour: Number(rem.time.split(':')[0]), minute: Number(rem.time.split(':')[1]) }, { zone: 'Asia/Jakarta' });
        pushOccurrence(dt);
      } else if (rem.repeat === 'weekly') {
        const orig = DateTime.fromISO(`${rem.date}T${rem.time}`, { zone: 'Asia/Jakarta' });
        const origWeekday = orig.weekday;
        if (now.weekday === origWeekday) {
          const dt = DateTime.fromObject({ year: now.year, month: now.month, day: now.day, hour: Number(rem.time.split(':')[0]), minute: Number(rem.time.split(':')[1]) }, { zone: 'Asia/Jakarta' });
          pushOccurrence(dt);
        }
      } else if (rem.repeat === 'monthly') {
        const orig = DateTime.fromISO(`${rem.date}T${rem.time}`, { zone: 'Asia/Jakarta' });
        const day = orig.day;
        const lastDayOfMonth = DateTime.local(now.year, now.month).setZone('Asia/Jakarta').endOf('month').day;
        if (day <= lastDayOfMonth) {
          const dt = DateTime.fromObject({ year: now.year, month: now.month, day, hour: Number(rem.time.split(':')[0]), minute: Number(rem.time.split(':')[1]) }, { zone: 'Asia/Jakarta' });
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
              (async () => {
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

startBot().catch(e => console.error('Start bot failed', e));

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
