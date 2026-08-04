import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ success: false, error: 'Validasi gagal', details: errors });
      return;
    }
    req[source] = result.data;
    next();
  };

// Common schemas
export const schemas = {
  register: z.object({
    token: z.string().uuid('Token tidak valid'),
    name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    age: z.number().int().min(10).max(120),
    timezone: z.enum(['WIB', 'WITA', 'WIT']),
    occupation: z.string().min(2).max(100),
    incomeSource: z.string().min(2).max(100),
    financialGoal: z.string().max(500).optional(),
  }),

  createTransaction: z.object({
    amount: z.number().positive('Nominal harus positif'),
    categoryId: z.string(),
    description: z.string().min(1).max(200),
    note: z.string().max(500).optional(),
    date: z.string().optional(),
  }),

  createIncome: z.object({
    amount: z.number().positive(),
    source: z.enum(['salary', 'bonus', 'freelance', 'thr', 'refund', 'gift', 'business', 'other']),
    description: z.string().min(1).max(200),
    note: z.string().max(500).optional(),
    date: z.string().optional(),
  }),

  createBudget: z.object({
    categoryId: z.string(),
    amount: z.number().positive(),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
    rollover: z.boolean().optional(),
  }),

  createDebt: z.object({
    type: z.enum(['debt', 'receivable', 'installment']),
    counterpartyName: z.string().min(1).max(100),
    amount: z.number().positive(),
    description: z.string().min(1).max(200),
    dueDate: z.string().optional(),
    installmentAmount: z.number().positive().optional(),
    installmentFrequency: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  }),

  debtPayment: z.object({
    amount: z.number().positive(),
    note: z.string().max(200).optional(),
  }),

  createReminder: z.object({
    type: z.enum(['bill', 'debt', 'installment', 'budget', 'saving', 'custom']),
    title: z.string().min(1).max(100),
    description: z.string().max(300).optional(),
    amount: z.number().positive().optional(),
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']),
    dueDate: z.string(),
    relatedId: z.string().optional(),
  }),

  createSavingGoal: z.object({
    name: z.string().min(1).max(100),
    targetAmount: z.number().positive(),
    deadline: z.string().optional(),
  }),

  savingTransaction: z.object({
    type: z.enum(['deposit', 'withdrawal']),
    amount: z.number().positive(),
    description: z.string().min(1).max(200),
    goalId: z.string().optional(),
  }),

  createCategory: z.object({
    name: z.string().min(1).max(50),
    icon: z.string().max(10).optional(),
    color: z.string().max(20).optional(),
  }),

  botMessage: z.object({
    message: z.string().min(1).max(1000),
  }),

  paginationQuery: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
  }),

  updateUser: z.object({
    name: z.string().min(2).max(100).optional(),
    age: z.number().int().min(10).max(120).optional(),
    timezone: z.enum(['WIB', 'WITA', 'WIT']).optional(),
    occupation: z.string().min(2).max(100).optional(),
    incomeSource: z.string().min(2).max(100).optional(),
    financialGoal: z.string().max(500).optional(),
  }),
};
