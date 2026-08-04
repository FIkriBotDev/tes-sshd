import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const { token, ...userData } = req.body;
    const { user, jwtToken } = await this.authService.register(token, userData);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          timezone: user.timezone,
          balance: user.balance,
        },
        token: jwtToken,
      },
      message: `Selamat datang, ${user.name}! Akun TemanDuit kamu sudah siap. 🎉`,
    });
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = this.authService.getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: 'User tidak ditemukan' });
      return;
    }

    res.json({ success: true, data: user });
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.authService.updateUser(req.userId!, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'User tidak ditemukan' });
      return;
    }

    res.json({ success: true, data: updated, message: 'Profil berhasil diperbarui' });
  });

  validateToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const regToken = this.authService.validateRegistrationToken(token);

    if (!regToken) {
      res.status(400).json({ success: false, error: 'Token tidak valid atau sudah kedaluwarsa' });
      return;
    }

    res.json({ success: true, data: { telegramId: regToken.telegramId, expiresAt: regToken.expiresAt } });
  });
}
