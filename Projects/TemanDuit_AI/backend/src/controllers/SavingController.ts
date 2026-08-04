import type { Response } from 'express';
import { SavingEngine } from '../engines/SavingEngine';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';
import { DatabaseManager } from '../database/DatabaseManager';

export class SavingController {
  constructor(private savingEngine: SavingEngine, private db: DatabaseManager) {}

  getGoals = asyncHandler(async (req: AuthRequest, res: Response) => {
    const goals = this.savingEngine.getGoals(req.userId!);
    res.json({ success: true, data: goals });
  });

  getGoalById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const goal = this.savingEngine.getGoalById(req.userId!, req.params.id);
    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: goal });
  });

  createGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const goal = await this.savingEngine.createGoal(req.userId!, req.body);
    res.status(201).json({ success: true, data: goal, message: 'Target tabungan berhasil dibuat' });
  });

  updateGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.savingEngine.updateGoal(req.userId!, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Goal tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Target tabungan diperbarui' });
  });

  deleteGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleted = await this.savingEngine.deleteGoal(req.userId!, req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Goal tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Target tabungan dihapus' });
  });

  getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = '20' } = req.query as Record<string, string>;
    const txs = this.savingEngine.getSavingTransactions(req.userId!, parseInt(limit));
    res.json({ success: true, data: txs });
  });

  createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, amount, description, goalId } = req.body;
    const tx = await this.savingEngine.recordSaving(req.userId!, {
      action: 'saving',
      type,
      amount,
      description,
      goalName: goalId
        ? (this.savingEngine.getGoalById(req.userId!, goalId)?.name)
        : undefined,
    });

    const user = this.db.findById('users', req.userId!);
    res.status(201).json({
      success: true,
      data: { ...tx, newBalance: user?.balance, newSavingBalance: user?.savingBalance },
      message: type === 'deposit' ? 'Dana berhasil ditabung' : 'Dana berhasil ditarik',
    });
  });

  getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = this.db.findById('users', req.userId!);
    const goals = this.savingEngine.getGoals(req.userId!);
    const completed = goals.filter((g) => g.isCompleted).length;

    res.json({
      success: true,
      data: {
        totalSaving: user?.savingBalance || 0,
        totalGoals: goals.length,
        completedGoals: completed,
        activeGoals: goals.length - completed,
      },
    });
  });
}
