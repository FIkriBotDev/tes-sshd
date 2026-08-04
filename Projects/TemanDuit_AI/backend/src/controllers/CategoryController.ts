import type { Response } from 'express';
import { DatabaseManager } from '../database/DatabaseManager';
import { asyncHandler } from '../middlewares/errorHandler';
import type { AuthRequest } from '../middlewares/auth';
import { generateId, nowISO, sanitizeString } from '../utils/helpers';
import type { Category } from '../types';

export class CategoryController {
  constructor(private db: DatabaseManager) {}

  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const categories = this.db.findWhere('categories', (c) => c.userId === req.userId!) as Category[];
    res.json({ success: true, data: categories });
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, icon, color } = req.body;

    // Check duplicate
    const existing = this.db.findWhere('categories', (c) => {
      return c.userId === req.userId! && c.name.toLowerCase() === name.toLowerCase();
    });

    if (existing.length > 0) {
      res.status(400).json({ success: false, error: 'Kategori dengan nama ini sudah ada' });
      return;
    }

    const category: Category = {
      id: generateId(),
      userId: req.userId!,
      name: sanitizeString(name),
      icon: icon ? sanitizeString(icon) : undefined,
      color: color ? sanitizeString(color) : undefined,
      isDefault: false,
      createdAt: nowISO(),
    };

    await this.db.create('categories', category);
    res.status(201).json({ success: true, data: category, message: 'Kategori berhasil dibuat' });
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cat = this.db.findById('categories', req.params.id) as Category | undefined;
    if (!cat || cat.userId !== req.userId) {
      res.status(404).json({ success: false, error: 'Kategori tidak ditemukan' });
      return;
    }

    if (cat.isDefault) {
      res.status(400).json({ success: false, error: 'Kategori default tidak bisa diubah' });
      return;
    }

    const updated = await this.db.update('categories', req.params.id, {
      name: req.body.name ? sanitizeString(req.body.name) : cat.name,
      icon: req.body.icon,
      color: req.body.color,
    });

    res.json({ success: true, data: updated, message: 'Kategori diperbarui' });
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cat = this.db.findById('categories', req.params.id) as Category | undefined;
    if (!cat || cat.userId !== req.userId) {
      res.status(404).json({ success: false, error: 'Kategori tidak ditemukan' });
      return;
    }

    if (cat.isDefault) {
      res.status(400).json({ success: false, error: 'Kategori default tidak bisa dihapus' });
      return;
    }

    await this.db.delete('categories', req.params.id);
    res.json({ success: true, message: 'Kategori dihapus' });
  });
}
