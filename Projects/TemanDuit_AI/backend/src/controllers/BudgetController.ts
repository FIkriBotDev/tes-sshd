import type { Response } from 'express';
import { BudgetEngine } from '../engines/BudgetEngine';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';
import { DatabaseManager } from '../database/DatabaseManager';
import { getCurrentMonthYear } from '../utils/helpers';

export class BudgetController {
  constructor(private budgetEngine: BudgetEngine, private db: DatabaseManager) {}

  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.query as Record<string, string>;
    const { month: cm, year: cy } = getCurrentMonthYear();

    const m = month ? parseInt(month) : cm;
    const y = year ? parseInt(year) : cy;

    const budgets = this.budgetEngine.getBudgets(req.userId!, m, y).map((b) => {
      const cat = this.db.findById('categories', b.categoryId);
      const progress = this.budgetEngine.getBudgetProgress(b);
      return { ...b, categoryName: cat?.name, categoryIcon: cat?.icon, categoryColor: cat?.color, ...progress };
    });

    res.json({ success: true, data: budgets });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const budget = this.budgetEngine.getBudgetById(req.userId!, req.params.id);
    if (!budget) {
      res.status(404).json({ success: false, error: 'Budget tidak ditemukan' });
      return;
    }

    const cat = this.db.findById('categories', budget.categoryId);
    const progress = this.budgetEngine.getBudgetProgress(budget);

    res.json({ success: true, data: { ...budget, categoryName: cat?.name, ...progress } });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const budget = await this.budgetEngine.createBudget(req.userId!, req.body);
    res.status(201).json({ success: true, data: budget, message: 'Budget berhasil dibuat' });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.budgetEngine.updateBudget(req.userId!, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Budget tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Budget diperbarui' });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleted = await this.budgetEngine.deleteBudget(req.userId!, req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Budget tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Budget dihapus' });
  });

  getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { months = '6' } = req.query as Record<string, string>;
    const history = this.budgetEngine.getBudgetHistory(req.userId!, parseInt(months));
    res.json({ success: true, data: history });
  });
}
