import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import type { DatabaseSchema } from '../types';

// ============================================================
// DatabaseManager - Single point of truth for all DB operations
// ============================================================

const DEFAULT_DB: DatabaseSchema = {
  users: [],
  registrationTokens: [],
  loginCodes: [],
  categories: [],
  transactions: [],
  budgets: [],
  debts: [],
  debtPayments: [],
  reminders: [],
  savingGoals: [],
  savingTransactions: [],
  notifications: [],
  aiInsights: [],
};

export class DatabaseManager {
  private static instance: DatabaseManager;
  private dbPath: string;
  private cache: DatabaseSchema | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.ensureDbFile();
  }

  static getInstance(dbPath?: string): DatabaseManager {
    if (!DatabaseManager.instance) {
      if (!dbPath) throw new Error('DatabaseManager: dbPath is required on first init');
      DatabaseManager.instance = new DatabaseManager(dbPath);
    }
    return DatabaseManager.instance;
  }

  private ensureDbFile(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      logger.info(`[DB] Database initialized at ${this.dbPath}`);
    }
  }

  read(): DatabaseSchema {
    if (this.cache) return this.cache;
    try {
      const raw = fs.readFileSync(this.dbPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      // Merge with defaults to handle schema migrations
      this.cache = { ...DEFAULT_DB, ...parsed };
      return this.cache;
    } catch (err) {
      logger.error('[DB] Failed to read database', { error: err });
      this.cache = { ...DEFAULT_DB };
      return this.cache;
    }
  }

  private async persist(data: DatabaseSchema): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempPath = `${this.dbPath}.tmp`;
      try {
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tempPath, this.dbPath);
        this.cache = data;
        resolve();
      } catch (err) {
        logger.error('[DB] Failed to write database', { error: err });
        reject(err);
      }
    });
  }

  write(data: DatabaseSchema): Promise<void> {
    this.writeQueue = this.writeQueue.then(() => this.persist(data)).catch((err) => {
      logger.error('[DB] Write queue error', { error: err });
    });
    return this.writeQueue;
  }

  invalidateCache(): void {
    this.cache = null;
  }

  // ---- Generic CRUD ----

  findAll<K extends keyof DatabaseSchema>(collection: K): DatabaseSchema[K] {
    return this.read()[collection];
  }

  findById<K extends keyof DatabaseSchema>(
    collection: K,
    id: string,
  ): DatabaseSchema[K][number] | undefined {
    const items = this.read()[collection] as Array<{ id: string }>;
    return items.find((item) => item.id === id) as DatabaseSchema[K][number] | undefined;
  }

  findWhere<K extends keyof DatabaseSchema>(
    collection: K,
    predicate: (item: DatabaseSchema[K][number]) => boolean,
  ): DatabaseSchema[K] {
    const items = this.read()[collection] as Array<DatabaseSchema[K][number]>;
    return items.filter(predicate) as DatabaseSchema[K];
  }

  async create<K extends keyof DatabaseSchema>(
    collection: K,
    item: DatabaseSchema[K][number],
  ): Promise<DatabaseSchema[K][number]> {
    const db = this.read();
    (db[collection] as Array<DatabaseSchema[K][number]>).push(item);
    await this.write(db);
    return item;
  }

  async update<K extends keyof DatabaseSchema>(
    collection: K,
    id: string,
    updates: Partial<DatabaseSchema[K][number]>,
  ): Promise<DatabaseSchema[K][number] | null> {
    const db = this.read();
    const items = db[collection] as Array<{ id: string } & DatabaseSchema[K][number]>;
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates };
    await this.write(db);
    return items[index] as DatabaseSchema[K][number];
  }

  async delete<K extends keyof DatabaseSchema>(collection: K, id: string): Promise<boolean> {
    const db = this.read();
    const items = db[collection] as Array<{ id: string }>;
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    await this.write(db);
    return true;
  }

  async deleteWhere<K extends keyof DatabaseSchema>(
    collection: K,
    predicate: (item: DatabaseSchema[K][number]) => boolean,
  ): Promise<number> {
    const db = this.read();
    const items = db[collection] as Array<DatabaseSchema[K][number]>;
    const before = items.length;
    const filtered = items.filter((item) => !predicate(item));
    (db[collection] as Array<DatabaseSchema[K][number]>) = filtered;
    await this.write(db);
    return before - filtered.length;
  }

  count<K extends keyof DatabaseSchema>(collection: K): number {
    return (this.read()[collection] as unknown[]).length;
  }
}
