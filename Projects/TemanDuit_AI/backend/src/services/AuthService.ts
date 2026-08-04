import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';
import { DatabaseManager } from '../database/DatabaseManager';
import { seedUserCategories } from '../database/seedCategories';
import { config } from '../config';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { User, RegistrationToken, LoginCode, JWTPayload } from '../types';

// ---- Helper: generate kode 8 karakter alfanumerik uppercase ----
function generateLoginCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // hapus karakter mirip: I,O,1,0
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class AuthService {
  constructor(private db: DatabaseManager) {}

  // ============================================================
  // JWT
  // ============================================================

  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as string });
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      return null;
    }
  }

  // ============================================================
  // Registration Token
  // ============================================================

  async createRegistrationToken(telegramId: string): Promise<RegistrationToken> {
    const db = this.db.read();

    // Invalidate existing unused tokens for this telegramId
    db.registrationTokens = db.registrationTokens.map((t) =>
      t.telegramId === telegramId && !t.used ? { ...t, used: true } : t,
    );

    const token: RegistrationToken = {
      token: uuidv4(),
      telegramId,
      expiresAt: addHours(new Date(), config.registration.tokenExpiryHours).toISOString(),
      used: false,
    };

    db.registrationTokens.push(token);
    await this.db.write(db);

    logger.info('[Auth] Registration token created', { telegramId });
    return token;
  }

  validateRegistrationToken(token: string): RegistrationToken | null {
    const allTokens = this.db.findAll('registrationTokens') as RegistrationToken[];
    const found = allTokens.find((t) => t.token === token);

    if (!found) return null;
    if (found.used) return null;
    if (new Date(found.expiresAt) < new Date()) return null;

    return found;
  }

  // ============================================================
  // Register
  // ============================================================

  async register(
    token: string,
    data: {
      name: string;
      age: number;
      timezone: import('../types').Timezone;
      occupation: string;
      incomeSource: string;
      financialGoal?: string;
    },
  ): Promise<{ user: User; jwtToken: string; loginCode: string }> {
    const regToken = this.validateRegistrationToken(token);
    if (!regToken) throw new Error('Token tidak valid atau sudah kedaluwarsa');

    // Check if telegramId already registered
    const existing = this.db.findWhere('users', (u) => u.telegramId === regToken.telegramId);
    if (existing.length > 0) throw new Error('Akun sudah terdaftar');

    const userId = generateId();
    const user: User = {
      id: userId,
      telegramId: regToken.telegramId,
      name: data.name,
      age: data.age,
      timezone: data.timezone,
      occupation: data.occupation,
      incomeSource: data.incomeSource,
      financialGoal: data.financialGoal,
      balance: 0,
      savingBalance: 0,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    const db = this.db.read();

    // Save user
    db.users.push(user);

    // Seed default categories
    const categories = seedUserCategories(userId);
    db.categories.push(...categories);

    // Mark token as used
    const idx = db.registrationTokens.findIndex((t) => t.token === token);
    if (idx !== -1) db.registrationTokens[idx].used = true;

    // Generate login code
    const loginCodeStr = generateLoginCode();
    const loginCodeEntry: LoginCode = {
      code: loginCodeStr,
      userId,
      createdAt: nowISO(),
      isActive: true,
    };
    if (!db.loginCodes) db.loginCodes = [];
    db.loginCodes.push(loginCodeEntry);

    await this.db.write(db);

    const jwtToken = this.generateToken({ userId, telegramId: regToken.telegramId });

    logger.info('[Auth] User registered', { userId, telegramId: regToken.telegramId });
    return { user, jwtToken, loginCode: loginCodeStr };
  }

  // ============================================================
  // Login Code
  // ============================================================

  /**
   * Validasi kode login dan kembalikan JWT token.
   * Kode tetap aktif (tidak hangus setelah dipakai) — user bisa login berkali-kali.
   * Tapi setiap regenerate, kode lama dinonaktifkan.
   */
  loginWithCode(code: string): { user: User; jwtToken: string } | null {
    const db = this.db.read();
    if (!db.loginCodes) return null;

    const entry = db.loginCodes.find(
      (c) => c.code === code.trim().toUpperCase() && c.isActive,
    );

    if (!entry) return null;

    const user = db.users.find((u) => u.id === entry.userId);
    if (!user) return null;

    const jwtToken = this.generateToken({ userId: user.id, telegramId: user.telegramId });

    logger.info('[Auth] Login with code', { userId: user.id });
    return { user, jwtToken };
  }

  /**
   * Regenerate login code untuk user (dipanggil via /akundashboard).
   * Kode lama dinonaktifkan, kode baru dibuat.
   */
  async regenerateLoginCode(userId: string): Promise<string> {
    const db = this.db.read();
    if (!db.loginCodes) db.loginCodes = [];

    // Nonaktifkan semua kode lama user ini
    db.loginCodes = db.loginCodes.map((c) =>
      c.userId === userId ? { ...c, isActive: false } : c,
    );

    // Buat kode baru
    const newCode = generateLoginCode();
    db.loginCodes.push({
      code: newCode,
      userId,
      createdAt: nowISO(),
      isActive: true,
    });

    await this.db.write(db);

    logger.info('[Auth] Login code regenerated', { userId });
    return newCode;
  }

  /**
   * Tandai kode sudah pernah ditampilkan (untuk UI "sekali lihat").
   */
  async markCodeShown(userId: string): Promise<void> {
    const db = this.db.read();
    if (!db.loginCodes) return;

    const idx = db.loginCodes.findIndex((c) => c.userId === userId && c.isActive);
    if (idx !== -1) {
      db.loginCodes[idx].shownAt = nowISO();
      await this.db.write(db);
    }
  }

  getActiveLoginCode(userId: string): LoginCode | null {
    const db = this.db.read();
    if (!db.loginCodes) return null;
    return db.loginCodes.find((c) => c.userId === userId && c.isActive) ?? null;
  }

  // ============================================================
  // User helpers
  // ============================================================

  getUserById(userId: string): User | null {
    return (this.db.findById('users', userId) as User | undefined) || null;
  }

  getUserByTelegramId(telegramId: string): User | null {
    const users = this.db.findWhere('users', (u) => u.telegramId === telegramId) as User[];
    return users[0] || null;
  }

  async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'age' | 'timezone' | 'occupation' | 'incomeSource' | 'financialGoal'>>,
  ): Promise<User | null> {
    return this.db.update('users', userId, { ...updates, updatedAt: nowISO() }) as Promise<User | null>;
  }

  isRegistered(telegramId: string): boolean {
    return this.db.findWhere('users', (u) => u.telegramId === telegramId).length > 0;
  }
}
