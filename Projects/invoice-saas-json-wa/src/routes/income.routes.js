import { Router } from 'express';
import { DB } from '../services/storage.js';

export const incomeRouter = Router();

incomeRouter.get('/', async (req, res) => {
  try {
    const data = await DB.readIncome();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Optional: summary endpoint (total by month/year)
incomeRouter.get('/summary', async (req, res) => {
  try {
    const { income } = await DB.readIncome();
    // simple summary: total income overall
    const total = income.reduce((s, r) => s + Number(r.amount || 0), 0);
    res.json({ total, count: income.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
