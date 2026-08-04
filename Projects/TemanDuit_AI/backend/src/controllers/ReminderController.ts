import type { Response } from 'express';
import { ReminderEngine } from '../engines/ReminderEngine';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';

export class ReminderController {
  constructor(private reminderEngine: ReminderEngine) {}

  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { active } = req.query as Record<string, string>;
    const reminders = this.reminderEngine.getReminders(req.userId!, active === 'true');
    res.json({ success: true, data: reminders });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reminder = this.reminderEngine.getReminderById(req.userId!, req.params.id);
    if (!reminder) {
      res.status(404).json({ success: false, error: 'Reminder tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: reminder });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const reminder = await this.reminderEngine.createReminder(req.userId!, req.body);
    res.status(201).json({ success: true, data: reminder, message: 'Reminder berhasil dibuat' });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.reminderEngine.updateReminder(req.userId!, req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Reminder tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Reminder diperbarui' });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleted = await this.reminderEngine.deleteReminder(req.userId!, req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Reminder tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Reminder dihapus' });
  });

  getUpcoming = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { days = '7' } = req.query as Record<string, string>;
    const upcoming = this.reminderEngine.getUpcomingReminders(req.userId!, parseInt(days));
    res.json({ success: true, data: upcoming });
  });
}
