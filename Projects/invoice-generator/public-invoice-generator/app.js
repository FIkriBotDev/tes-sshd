// public/app.js

const itemsEl = document.getElementById('items');
const addItemBtn = document.getElementById('addItem');
const generateBtn = document.getElementById('generate');

// Rupiah formatter
function rupiah(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

// Buat row item baru
function makeRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'item';
  row.innerHTML = `
    <input class="desc" placeholder="Description" value="${data.description || ''}" />
    <input class="qty" type="number" min="0" step="1" value="${data.quantity || 1}" />
    <input class="price" type="number" min="0" step="1" value="${data.unitPrice || 0}" />
    <div class="amount">${rupiah((data.quantity || 1) * (data.unitPrice || 0))}</div>
    <button class="remove">✕</button>
  `;

  const qty = row.querySelector('.qty');
  const price = row.querySelector('.price');
  const amount = row.querySelector('.amount');
  const remove = row.querySelector('.remove');

  function recalc() {
    const q = Number(qty.value || 0);
    const p = Number(price.value || 0);
    amount.textContent = rupiah(q * p);
  }

  qty.addEventListener('input', recalc);
  price.addEventListener('input', recalc);

  remove.addEventListener('click', () => {
    row.remove();
  });

  return row;
}

// Default satu row
itemsEl.appendChild(makeRow());

// Add item
addItemBtn.addEventListener('click', (e) => {
  e.preventDefault();
  itemsEl.appendChild(makeRow());
});

// Generate invoice
generateBtn.addEventListener('click', async () => {
  const from = {
    name: document.getElementById('fromName').value,
    address: document.getElementById('fromAddress').value,
  };
  const to = {
    name: document.getElementById('toName').value,
    address: document.getElementById('toAddress').value,
  };
  const invoiceNumber = document.getElementById('invoiceNumber').value || undefined;
  const issueDate = document.getElementById('issueDate').value || undefined;
  const dueDate = document.getElementById('dueDate').value || undefined;
  const notes = document.getElementById('notes').value;

  const items = Array.from(itemsEl.querySelectorAll('.item')).map(row => {
    return {
      description: row.querySelector('.desc').value,
      quantity: Number(row.querySelector('.qty').value || 0),
      unitPrice: Number(row.querySelector('.price').value || 0),
    };
  });

  // 🔹 FormData untuk handle data teks + file
  const formData = new FormData();
  formData.append("from", JSON.stringify(from));
  formData.append("to", JSON.stringify(to));
  formData.append("invoiceNumber", invoiceNumber || "");
  formData.append("issueDate", issueDate || "");
  formData.append("dueDate", dueDate || "");
  formData.append("notes", notes);
  formData.append("items", JSON.stringify(items));

  // tambahkan file logo jika ada
  const logoFile = document.getElementById("logo")?.files[0];
  if (logoFile) {
    formData.append("logo", logoFile);
  }

  try {
    const res = await fetch('/api/generate-invoice', {
      method: 'POST',
      body: formData // 👈 tidak pakai JSON.stringify lagi
    });

    if (!res.ok) throw new Error('Failed to generate invoice');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    // Auto-download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber || 'invoice'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Error: ' + err.message);
  }
});
