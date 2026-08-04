import type { Response } from 'express';
import { ExpenseEngine } from '../engines/ExpenseEngine';
import { IncomeEngine } from '../engines/IncomeEngine';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';
import type { Transaction } from '../types';
import { DatabaseManager } from '../database/DatabaseManager';

export class TransactionController {
  constructor(
    private expenseEngine: ExpenseEngine,
    private incomeEngine: IncomeEngine,
    private db: DatabaseManager,
  ) {}

  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, month, year, type } = req.query as Record<string, string>;
    const userId = req.userId!;

    let transactions = this.db.findWhere('transactions', (t) => {
      return (t as Transaction).userId === userId;
    }) as Transaction[];

    if (month && year) {
      transactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
      });
    }

    if (type === 'income' || type === 'expense') {
      transactions = transactions.filter((t) => t.type === type);
    }

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = transactions.length;
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const offset = (pageNum - 1) * limitNum;
    const paged = transactions.slice(offset, offset + limitNum);

    // Attach category name
    const enriched = paged.map((t) => {
      const cat = this.db.findById('categories', t.categoryId);
      return { ...t, categoryName: cat?.name || 'Lainnya', categoryIcon: cat?.icon };
    });

    res.json({
      success: true,
      data: enriched,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tx = this.db.findById('transactions', req.params.id) as Transaction | undefined;
    if (!tx || tx.userId !== req.userId) {
      res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
      return;
    }

    const cat = this.db.findById('categories', tx.categoryId);
    res.json({ success: true, data: { ...tx, categoryName: cat?.name, categoryIcon: cat?.icon } });
  });

  createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tx = await this.expenseEngine.recordManual(req.userId!, req.body);
    const cat = this.db.findById('categories', tx.categoryId);
    res.status(201).json({
      success: true,
      data: { ...tx, categoryName: cat?.name },
      message: 'Pengeluaran berhasil dicatat',
    });
  });

  createIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tx = await this.incomeEngine.recordManual(req.userId!, req.body);
    res.status(201).json({
      success: true,
      data: tx,
      message: 'Pemasukan berhasil dicatat',
    });
  });

  updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.expenseEngine.updateTransaction(req.userId!, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Transaksi diperbarui' });
  });

  updateIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.incomeEngine.updateTransaction(req.userId!, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Pemasukan diperbarui' });
  });

  deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleted = await this.expenseEngine.deleteTransaction(req.userId!, req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Transaksi dihapus' });
  });

  deleteIncome = asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleted = await this.incomeEngine.deleteTransaction(req.userId!, req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Pemasukan dihapus' });
  });
}
