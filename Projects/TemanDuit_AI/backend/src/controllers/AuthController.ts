import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { getBotInstance } from '../routes';
import type { AuthRequest } from '../middlewares/auth';

export class AuthController {
  constructor(private authService: AuthService) {}

  // ---- Register ----
  register = asyncHandler(async (req: Request, res: Response) => {
    const { token, ...userData } = req.body;
    const { user, jwtToken, loginCode } = await this.authService.register(token, userData);

    // Kirim login code ke Telegram user (fire and forget)
    const bot = getBotInstance();
    if (bot) {
      bot.sendLoginCodeAfterRegister(user.telegramId, user.name, loginCode).catch(() => {});
    }

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
        loginCode,
      },
      message: `Selamat datang, ${user.name}! Akun TemanDuit kamu sudah siap. 🎉`,
    });
  });

  // ---- Validate Registration Token ----
  validateToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    logger.info('[Auth] Validating token', { token });
    const regToken = this.authService.validateRegistrationToken(token);

    if (!regToken) {
      logger.warn('[Auth] Token invalid or expired', { token });
      res.status(400).json({ success: false, error: 'Token tidak valid atau sudah kedaluwarsa' });
      return;
    }

    logger.info('[Auth] Token valid', { telegramId: regToken.telegramId });
    res.json({ success: true, data: { telegramId: regToken.telegramId, expiresAt: regToken.expiresAt } });
  });

  // ---- Get Profile ----
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = this.authService.getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: 'User tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: user });
  });

  // ---- Update Profile ----
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await this.authService.updateUser(req.userId!, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'User tidak ditemukan' });
      return;
    }
    res.json({ success: true, data: updated, message: 'Profil berhasil diperbarui' });
  });

  // ---- Login dengan Kode Unik ----
  loginWithCode = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body as { code?: string };
    if (!code || code.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Kode login diperlukan' });
      return;
    }

    const result = this.authService.loginWithCode(code.trim());
    if (!result) {
      res.status(401).json({ success: false, error: 'Kode login tidak valid atau sudah tidak aktif' });
      return;
    }

    logger.info('[Auth] Login with code success', { userId: result.user.id });
    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.jwtToken,
      },
      message: `Selamat datang kembali, ${result.user.name}! 👋`,
    });
  });

  // ---- Regenerate Login Code (user yang sudah login) ----
  regenerateLoginCode = asyncHandler(async (req: AuthRequest, res: Response) => {
    const newCode = await this.authService.regenerateLoginCode(req.userId!);
    logger.info('[Auth] Login code regenerated via API', { userId: req.userId });
    res.json({
      success: true,
      data: { loginCode: newCode },
      message: 'Kode login baru berhasil dibuat. Simpan kode ini dengan aman!',
    });
  });

  // ---- Tandai kode sudah dilihat ----
  markCodeShown = asyncHandler(async (req: AuthRequest, res: Response) => {
    await this.authService.markCodeShown(req.userId!);
    res.json({ success: true });
  });
}
