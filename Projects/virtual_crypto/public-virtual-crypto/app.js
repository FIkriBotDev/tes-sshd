async function refresh() {
let r = await fetch('/api/me');
let d = await r.json();
if (d.error) return location.href = '/login.html';
price.innerText = d.price;
saldo.innerText = d.user.saldo.toLocaleString();
coin.innerText = d.user.coin.toFixed(4);
}
setInterval(refresh, 1111);