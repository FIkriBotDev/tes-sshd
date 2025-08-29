import { Router } from 'express';
import { DB } from '../services/storage.js';
import { nanoid } from '../utils/id.js';
import { sendText } from '../services/whatsapp.js';

export const dashboardRouter = Router();

// Dashboard page
dashboardRouter.get('/', async (req, res) => {
  try {
    const { invoices } = await DB.readInvoices();
    const { income } = await DB.readIncome();
    const unpaid = invoices.filter(i => i.status === 'unpaid').sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
    const paid = invoices.filter(i => i.status === 'paid').sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
    const totalIncome = income.reduce((s, x) => s + Number(x.amount||0), 0);
    res.render('dashboard', { unpaid, paid, income, totalIncome });
  } catch (e) {
    res.status(500).send('Error loading dashboard: ' + e.message);
  }
});

// New invoice form page
dashboardRouter.get('/new', (req, res) => {
  res.render('new-invoice');
});

// Create invoice from form (POST /new)
dashboardRouter.post('/new', async (req, res) => {
  try {
    const body = req.body || {};
    const items = [];
    if (body.item_name && body.item_price) {
      items.push({ name: String(body.item_name), price: Number(body.item_price) });
    }

    const payload = {
      customer_name: body.customer_name,
      customer_whatsapp: body.customer_whatsapp,
      items,
      total: Number(body.total),
      type: body.type || 'once',
    };

    if (!payload.customer_name || !payload.customer_whatsapp || !Number.isFinite(payload.total)) {
      return res.status(400).send('Form tidak lengkap');
    }

    const data = await DB.readInvoices();
    const id = 'inv_' + nanoid(8);
    const now = new Date().toISOString();
    const invoice = { id, ...payload, status: 'unpaid', created_at: now, next_schedule: payload.type === 'monthly' ? now : null };
    data.invoices.push(invoice);
    await DB.writeInvoices(data);

    // Send WA notification (best-effort)
try {
  await sendText(
    payload.customer_whatsapp,
    `*Tagihan Anda untuk ExodusCloud*\n\n` +
    `ID Reference: ${id}\n` +
    `Total: Rp ${Number(payload.total).toLocaleString('id-ID')}\n` +
    `Deskripsi: ExodusCloud - Invoice #${id}\n\n` +
    `Mohon segera selesaikan pembayaran sesuai tagihan.\n` +
    `Terima kasih telah menggunakan layanan ExodusCloud!`
  );
} catch (waErr) {
  console.warn('[dashboard.post.new] WA send error:', waErr?.message || waErr);
}
    res.redirect('/');
  } catch (e) {
    res.status(500).send('Error: ' + e.message);
  }
});

// Mark paid from dashboard (POST /pay/:id)
dashboardRouter.post('/pay/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = await DB.readInvoices();
    const inv = data.invoices.find(x => x.id === id);
    if (!inv) return res.status(404).send('Invoice not found');

    if (inv.status !== 'paid') {
      inv.status = 'paid';
      await DB.writeInvoices(data);

      // Record income
      const inc = await DB.readIncome();
      inc.income.push({ id: 'inc_' + nanoid(8), invoice_id: inv.id, amount: inv.total, date: new Date().toISOString() });
      await DB.writeIncome(inc);

      // Send thank-you
      try {
        await sendText(inv.customer_whatsapp, `Terima kasih, pembayaran untuk Invoice #${inv.id} sebesar Rp${inv.total.toLocaleString('id-ID')} telah kami terima 🙏`);
      } catch (waErr) {
        console.warn('[dashboard.pay] WA send error:', waErr?.message || waErr);
      }
    }

    res.redirect('/');
  } catch (e) {
    res.status(500).send('Error: ' + e.message);
  }
});
