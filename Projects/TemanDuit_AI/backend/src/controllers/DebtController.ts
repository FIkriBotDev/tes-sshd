import type { Response } from 'express';
import { DebtEngine } from '../engines/DebtEngine';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';

export class DebtController {
  constructor(private debtEngine: DebtEngine) {}

  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, type } = req.query as Record<string, string>;
    const debts = this.debtEngine.getDebts(req.userId!, {
      status: status as import('../types').DebtStatus | undefined,
      type: type as import('../types').Debt['type'] | undefined,
    });
    res.json({ success: true, data: debts });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const debt = this.debtEngine.getDebtById(req.userId!, req.params.id);
    if (!debt) {
      res.status(404).json({ success: false, error: 'Hutang tidak ditemukan' });
      return;
    }
    const payments = this.debtEngine.getPaymentHistory(req.userId!, req.params.id);
    res.json({ success: true, data: { ...debt, payments } });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const debt = await this.debtEngine.createDebt(req.userId!, req.body);
    res.status(201).json({ success: true, data: debt, message: 'Hutang berhasil dicatat' });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.debtEngine.updateDebt(req.userId!, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Hutang tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Hutang diperbarui' });
  });

  recordPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { debt, payment } = await this.debtEngine.recordPayment(
      req.userId!,
      req.params.id,
      req.body.amount,
      req.body.note,
    );
    res.json({ success: true, data: { debt, payment }, message: 'Pembayaran berhasil dicatat' });
  });

  cancel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cancelled = await this.debtEngine.cancelDebt(req.userId!, req.params.id);
    if (!cancelled) {
      res.status(404).json({ success: false, error: 'Hutang tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: cancelled, message: 'Hutang dibatalkan' });
  });

  getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const totalDebt = this.debtEngine.getTotalDebt(req.userId!);
    const totalReceivable = this.debtEngine.getTotalReceivable(req.userId!);
    const activeDebts = this.debtEngine.getDebts(req.userId!, { status: 'ACTIVE' });
    const overdueDebts = this.debtEngine.getDebts(req.userId!, { status: 'OVERDUE' });

    res.json({
      success: true,
      data: { totalDebt, totalReceivable, activeCount: activeDebts.length, overdueCount: overdueDebts.length },
    });
  });
}
