async function login() {
  let res = await fetch("/login", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      username:user.value,
      password:pass.value
    })
  });
  let data = await res.json();
  if(data.success) location="dashboard.html";
  else alert(data.error);
}

async function register() {
  await fetch("/register", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      username:user.value,
      password:pass.value
    })
  });
  alert("Register berhasil");
}

async function refresh() {
  let res = await fetch("/data");
  let d = await res.json();
  price.innerText = "Rp " + d.price;
  balance.innerText = "Rp " + d.balance;
  coin.innerText = d.coin.toFixed(4);
  portfolio.innerText = "Rp " + d.portfolio.toFixed(0);
}

setInterval(refresh, 2000);

async function deposit() {
  await fetch("/deposit", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ amount:amount.value })
  });
}

async function buy() {
  await fetch("/buy", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ amount:amount.value })
  });
}

async function sell() {
  await fetch("/sell", { method:"POST" });
}
