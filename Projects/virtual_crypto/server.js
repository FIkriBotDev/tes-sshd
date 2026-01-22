const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'exod-secret',
  resave: false,
  saveUninitialized: true
}));

// ================= INIT FILE =================
if (!fs.existsSync('data')) fs.mkdirSync('data');
if (!fs.existsSync('data/users.json')) fs.writeFileSync('data/users.json', '[]');
if (!fs.existsSync('data/coin.json')) fs.writeFileSync('data/coin.json', JSON.stringify({ price: 1000 }));

const readUsers = () => JSON.parse(fs.readFileSync('data/users.json'));
const saveUsers = d => fs.writeFileSync('data/users.json', JSON.stringify(d, null, 2));
const readCoin = () => JSON.parse(fs.readFileSync('data/coin.json'));
const saveCoin = d => fs.writeFileSync('data/coin.json', JSON.stringify(d, null, 2));

// ================= PRICE ENGINE =================
setInterval(() => {
  let c = readCoin();
  let change = Math.floor(Math.random() * 401 - 200); // -200 s/d +200
  c.price = Math.max(100, c.price + change);
  saveCoin(c);
}, 5000);

// ================= AUTH =================
app.post('/api/register', async (req, res) => {
  let users = readUsers();
  if (users.find(u => u.username === req.body.username))
    return res.json({ error: 'USER_EXISTS' });

  users.push({
    username: req.body.username,
    password: await bcrypt.hash(req.body.password, 10),
    saldo: 0,
    coin: 0
  });

  saveUsers(users);
  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  let user = readUsers().find(u => u.username === req.body.username);
  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return res.json({ error: 'INVALID_LOGIN' });

  req.session.user = user.username;
  res.json({ success: true });
});

// ================= USER INFO =================
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.json({ error: 'UNAUTHORIZED' });

  res.json({
    user: readUsers().find(u => u.username === req.session.user),
    price: readCoin().price
  });
});

// ================= DEPOSIT =================
app.post('/api/deposit', (req, res) => {
  let users = readUsers();
  let u = users.find(x => x.username === req.session.user);
  u.saldo += Number(req.body.amount);
  saveUsers(users);
  res.json({ success: true });
});

// ================= BUY =================
app.post('/api/buy', (req, res) => {
  let coin = readCoin();
  let users = readUsers();
  let u = users.find(x => x.username === req.session.user);

  if (Number(req.body.amount) < 10000 || u.saldo < req.body.amount)
    return res.json({ error: 'INVALID_BUY' });

  u.saldo -= Number(req.body.amount);
  u.coin += Number(req.body.amount) / coin.price;

  saveUsers(users);
  res.json({ success: true });
});

// ================= SELL =================
app.post('/api/sell', (req, res) => {
  let coin = readCoin();
  let users = readUsers();
  let u = users.find(x => x.username === req.session.user);

  if (Number(req.body.qty) > u.coin)
    return res.json({ error: 'NOT_ENOUGH_COIN' });

  u.coin -= Number(req.body.qty);
  u.saldo += Number(req.body.qty) * coin.price;

  saveUsers(users);
  res.json({ success: true });
});

// ================= SERVER =================
app.listen(3000, () => {
  console.log('EXOD Simulator running on http://localhost:3000');
});
