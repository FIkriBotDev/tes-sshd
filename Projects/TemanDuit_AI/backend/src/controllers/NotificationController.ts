import type { Response } from 'express';
import { NotificationEngine } from '../engines/NotificationEngine';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';

export class NotificationController {
  constructor(private notificationEngine: NotificationEngine) {}

  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { unread } = req.query as Record<string, string>;
    const notifications = this.notificationEngine.getNotifications(req.userId!, unread === 'true');
    const unreadCount = this.notificationEngine.getUnreadCount(req.userId!);

    res.json({ success: true, data: notifications, unreadCount });
  });

  markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const success = await this.notificationEngine.markRead(req.userId!, req.params.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Notifikasi tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Notifikasi ditandai sudah dibaca' });
  });

  markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.notificationEngine.markAllRead(req.userId!);
    res.json({ success: true, message: 'Semua notifikasi sudah dibaca' });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleted = await this.notificationEngine.deleteNotification(req.userId!, req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Notifikasi tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Notifikasi dihapus' });
  });

  getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const count = this.notificationEngine.getUnreadCount(req.userId!);
    res.json({ success: true, data: { count } });
  });
}
