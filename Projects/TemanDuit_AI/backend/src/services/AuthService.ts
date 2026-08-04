import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';
import { DatabaseManager } from '../database/DatabaseManager';
import { seedUserCategories } from '../database/seedCategories';
import { config } from '../config';
import { generateId, nowISO } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { User, RegistrationToken, JWTPayload } from '../types';

export class AuthService {
  constructor(private db: DatabaseManager) {}

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

  async createRegistrationToken(telegramId: string): Promise<RegistrationToken> {
    // Invalidate existing unused tokens for this telegramId
    const existing = this.db.findWhere(
      'registrationTokens',
      (t) => t.telegramId === telegramId && !t.used,
    );

    for (const t of existing) {
      await this.db.update('registrationTokens', t.token, { used: true });
    }

    const token: RegistrationToken = {
      token: uuidv4(),
      telegramId,
      expiresAt: addHours(new Date(), config.registration.tokenExpiryHours).toISOString(),
      used: false,
    };

    // Store token with token as "id"
    const db = this.db.read();
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
  ): Promise<{ user: User; jwtToken: string }> {
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

    await this.db.create('users', user);

    // Seed default categories
    const categories = seedUserCategories(userId);
    const db = this.db.read();
    db.categories.push(...categories);
    await this.db.write(db);

    // Mark token as used
    const allTokens = db.registrationTokens;
    const idx = allTokens.findIndex((t) => t.token === token);
    if (idx !== -1) allTokens[idx].used = true;
    await this.db.write(db);

    const jwtToken = this.generateToken({ userId, telegramId: regToken.telegramId });

    logger.info('[Auth] User registered', { userId, telegramId: regToken.telegramId });
    return { user, jwtToken };
  }

  async loginWithTelegramId(telegramId: string): Promise<{ user: User; jwtToken: string } | null> {
    const users = this.db.findWhere('users', (u) => u.telegramId === telegramId) as User[];
    if (users.length === 0) return null;

    const user = users[0];
    const jwtToken = this.generateToken({ userId: user.id, telegramId: user.telegramId });

    return { user, jwtToken };
  }

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
