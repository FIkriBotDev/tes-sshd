import { Router } from 'express';
import { DB } from '../services/storage.js';
import { nanoid } from '../utils/id.js';
import { sendText } from '../services/whatsapp.js';

export const invoicesRouter = Router();

// List all invoices
invoicesRouter.get('/', async (req, res) => {
  try {
    const data = await DB.readInvoices();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create invoice
invoicesRouter.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_whatsapp,
      items = [], // [{ name, price }]
      total,
      type = 'once', // 'once' | 'monthly'
    } = req.body || {};

    if (!customer_name || !customer_whatsapp || !Number.isFinite(Number(total))) {
      return res.status(400).json({ error: 'customer_name, customer_whatsapp, total wajib diisi' });
    }

    const { invoices } = await DB.readInvoices();

    const now = new Date().toISOString();
    const id = 'inv_' + nanoid(8);
    const invoice = {
      id,
      customer_name,
      customer_whatsapp,
      items,
      total: Number(total),
      type,
      status: 'unpaid',
      created_at: now,
      // For monthly: next_schedule is the ISO timestamp for the next recurrence (use created_at as base)
      next_schedule: type === 'monthly' ? now : null,
    };

    invoices.push(invoice);
    await DB.writeInvoices({ invoices });

    // Send initial invoice via WhatsApp (best-effort)
    try {
      await sendText(customer_whatsapp, `Halo ${customer_name}, ini invoice Anda #${id} sebesar Rp${Number(total).toLocaleString('id-ID')}. Mohon lakukan pembayaran. Terima kasih.`);
    } catch (waErr) {
      console.warn('[invoices.routes] WA send error:', waErr?.message || waErr);
    }

    res.json({ message: 'Invoice created', invoice });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark invoice as paid => also create income record and send thank-you
invoicesRouter.patch('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await DB.readInvoices();
    const inv = data.invoices.find(x => x.id === id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    if (inv.status === 'paid') {
      return res.json({ message: 'Already paid', invoice: inv });
    }

    inv.status = 'paid';
    await DB.writeInvoices(data);

    // Append income record
    const incomeDB = await DB.readIncome();
    const incomeId = 'inc_' + nanoid(8);
    incomeDB.income.push({
      id: incomeId,
      invoice_id: inv.id,
      amount: inv.total,
      date: new Date().toISOString(),
    });
    await DB.writeIncome(incomeDB);

    // Send thank-you (best-effort)
    try {
      await sendText(inv.customer_whatsapp, `Terima kasih, pembayaran untuk Invoice #${inv.id} sebesar Rp${inv.total.toLocaleString('id-ID')} telah kami terima 🙏`);
    } catch (waErr) {
      console.warn('[invoices.routes] WA thank-you send error:', waErr?.message || waErr);
    }

    res.json({ message: 'Invoice marked as paid, income recorded, thank-you sent', invoice: inv });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Optional: delete invoice
invoicesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await DB.readInvoices();
    const idx = data.invoices.findIndex(x => x.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });
    data.invoices.splice(idx, 1);
    await DB.writeInvoices(data);
    res.json({ message: 'Invoice deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
