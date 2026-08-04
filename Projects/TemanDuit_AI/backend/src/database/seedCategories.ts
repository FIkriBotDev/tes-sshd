import { generateId, nowISO } from '../utils/helpers';
import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Omit<Category, 'userId'>[] = [
  { id: 'cat-makanan', name: 'Makanan', icon: '🍜', color: '#F97316', isDefault: true, createdAt: nowISO() },
  { id: 'cat-minuman', name: 'Minuman', icon: '☕', color: '#F59E0B', isDefault: true, createdAt: nowISO() },
  { id: 'cat-transport', name: 'Transport', icon: '🚗', color: '#3B82F6', isDefault: true, createdAt: nowISO() },
  { id: 'cat-belanja', name: 'Belanja', icon: '🛍️', color: '#EC4899', isDefault: true, createdAt: nowISO() },
  { id: 'cat-tagihan', name: 'Tagihan', icon: '📄', color: '#EF4444', isDefault: true, createdAt: nowISO() },
  { id: 'cat-internet', name: 'Internet', icon: '🌐', color: '#8B5CF6', isDefault: true, createdAt: nowISO() },
  { id: 'cat-pulsa', name: 'Pulsa', icon: '📱', color: '#06B6D4', isDefault: true, createdAt: nowISO() },
  { id: 'cat-kesehatan', name: 'Kesehatan', icon: '🏥', color: '#10B981', isDefault: true, createdAt: nowISO() },
  { id: 'cat-pendidikan', name: 'Pendidikan', icon: '📚', color: '#6366F1', isDefault: true, createdAt: nowISO() },
  { id: 'cat-hiburan', name: 'Hiburan', icon: '🎮', color: '#F43F5E', isDefault: true, createdAt: nowISO() },
  { id: 'cat-bisnis', name: 'Bisnis', icon: '💼', color: '#64748B', isDefault: true, createdAt: nowISO() },
  { id: 'cat-investasi', name: 'Investasi', icon: '📈', color: '#059669', isDefault: true, createdAt: nowISO() },
  { id: 'cat-donasi', name: 'Donasi', icon: '💝', color: '#DB2777', isDefault: true, createdAt: nowISO() },
  { id: 'cat-pajak', name: 'Pajak', icon: '🏛️', color: '#92400E', isDefault: true, createdAt: nowISO() },
  { id: 'cat-lainnya', name: 'Lainnya', icon: '📦', color: '#6B7280', isDefault: true, createdAt: nowISO() },
];

export const seedUserCategories = (userId: string): Category[] => {
  return DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    id: `${cat.id}-${userId.substring(0, 8)}`,
    userId,
  }));
};

export const generateCustomCategoryId = (): string => `cat-custom-${generateId()}`;
