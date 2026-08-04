import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { DatabaseManager } from '../database/DatabaseManager';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  telegramId?: string;
}

const db = DatabaseManager.getInstance(config.database.path);
const authService = new AuthService(db);

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ success: false, error: 'Token tidak valid atau sudah kedaluwarsa' });
    return;
  }

  // Verify user still exists
  const user = authService.getUserById(payload.userId);
  if (!user) {
    res.status(401).json({ success: false, error: 'User tidak ditemukan' });
    return;
  }

  req.userId = payload.userId;
  req.telegramId = payload.telegramId;

  logger.debug('[Auth] Authenticated', { userId: payload.userId });
  next();
};
