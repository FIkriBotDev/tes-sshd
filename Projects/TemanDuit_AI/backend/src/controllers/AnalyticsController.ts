import type { Response } from 'express';
import { AnalyticsEngine } from '../engines/AnalyticsEngine';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';
import { getCurrentMonthYear } from '../utils/helpers';

export class AnalyticsController {
  constructor(private analyticsEngine: AnalyticsEngine) {}

  getFull = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.query as Record<string, string>;
    const { month: cm, year: cy } = getCurrentMonthYear();

    const data = this.analyticsEngine.getFullAnalytics(
      req.userId!,
      month ? parseInt(month) : cm,
      year ? parseInt(year) : cy,
    );

    res.json({ success: true, data });
  });

  getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.query as Record<string, string>;
    const { month: cm, year: cy } = getCurrentMonthYear();

    const summary = this.analyticsEngine.getFinancialSummary(
      req.userId!,
      month ? parseInt(month) : cm,
      year ? parseInt(year) : cy,
    );

    res.json({ success: true, data: summary });
  });

  getTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { months = '6' } = req.query as Record<string, string>;
    const m = parseInt(months);

    res.json({
      success: true,
      data: {
        income: this.analyticsEngine.getIncomeTrend(req.userId!, m),
        expense: this.analyticsEngine.getExpenseTrend(req.userId!, m),
        saving: this.analyticsEngine.getSavingTrend(req.userId!, m),
        budget: this.analyticsEngine.getBudgetTrend(req.userId!, m),
      },
    });
  });

  getDailySpending = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.query as Record<string, string>;
    const { month: cm, year: cy } = getCurrentMonthYear();

    const data = this.analyticsEngine.getDailySpending(
      req.userId!,
      month ? parseInt(month) : cm,
      year ? parseInt(year) : cy,
    );

    res.json({ success: true, data });
  });

  getCategoryBreakdown = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.query as Record<string, string>;
    const { month: cm, year: cy } = getCurrentMonthYear();

    const data = this.analyticsEngine.getCategoryBreakdown(
      req.userId!,
      month ? parseInt(month) : cm,
      year ? parseInt(year) : cy,
    );

    res.json({ success: true, data });
  });
}
