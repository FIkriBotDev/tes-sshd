const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "EXOD_SECRET",
  resave: false,
  saveUninitialized: true
}));

const USER_DB = "./data/users.json";
const MARKET_DB = "./data/market.json";

// ===== INIT FILE =====
if (!fs.existsSync(USER_DB)) fs.writeFileSync(USER_DB, JSON.stringify([]));
if (!fs.existsSync(MARKET_DB)) {
  fs.writeFileSync(MARKET_DB, JSON.stringify({
    price: 1000
  }));
}

// ===== MARKET PRICE RANDOMIZER =====
setInterval(() => {
  let market = JSON.parse(fs.readFileSync(MARKET_DB));
  let change = Math.floor(Math.random() * 200 - 100); // -100 to +100
  market.price = Math.max(100, market.price + change);
  fs.writeFileSync(MARKET_DB, JSON.stringify(market));
}, 5000);

// ===== AUTH =====
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  let users = JSON.parse(fs.readFileSync(USER_DB));

  if (users.find(u => u.username === username)) {
    return res.json({ error: "Username sudah ada" });
  }

  users.push({
    username,
    password: bcrypt.hashSync(password, 8),
    balance: 0,
    coin: 0
  });

  fs.writeFileSync(USER_DB, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  let users = JSON.parse(fs.readFileSync(USER_DB));
  let user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.json({ error: "Login gagal" });
  }

  req.session.user = username;
  res.json({ success: true });
});

// ===== DATA =====
app.get("/data", (req, res) => {
  if (!req.session.user) return res.json({ error: "Unauthorized" });

  let users = JSON.parse(fs.readFileSync(USER_DB));
  let market = JSON.parse(fs.readFileSync(MARKET_DB));
  let user = users.find(u => u.username === req.session.user);

  res.json({
    price: market.price,
    balance: user.balance,
    coin: user.coin,
    portfolio: user.coin * market.price
  });
});

// ===== DEPOSIT =====
app.post("/deposit", (req, res) => {
  let users = JSON.parse(fs.readFileSync(USER_DB));
  let user = users.find(u => u.username === req.session.user);
  user.balance += Number(req.body.amount);
  fs.writeFileSync(USER_DB, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

// ===== BUY =====
app.post("/buy", (req, res) => {
  let amount = Number(req.body.amount);
  if (amount < 10000) return res.json({ error: "Minimal beli Rp10.000" });

  let users = JSON.parse(fs.readFileSync(USER_DB));
  let market = JSON.parse(fs.readFileSync(MARKET_DB));
  let user = users.find(u => u.username === req.session.user);

  if (user.balance < amount) return res.json({ error: "Saldo kurang" });

  let coin = amount / market.price;
  user.balance -= amount;
  user.coin += coin;

  fs.writeFileSync(USER_DB, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

// ===== SELL =====
app.post("/sell", (req, res) => {
  let users = JSON.parse(fs.readFileSync(USER_DB));
  let market = JSON.parse(fs.readFileSync(MARKET_DB));
  let user = users.find(u => u.username === req.session.user);

  let value = user.coin * market.price;
  user.balance += value;
  user.coin = 0;

  fs.writeFileSync(USER_DB, JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.listen(1111, () => {
  console.log("EXOD Simulator running on http://localhost:1111");
});
