import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: id });
  } catch {
    return dateStr;
  }
}

export function formatDatetime(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM yyyy HH:mm');
}

export function formatRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return formatDate(dateStr);
}

export function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((part / total) * 100), 100);
}

export function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return months[month - 1] || '';
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'text-yellow-500',
    PARTIAL: 'text-orange-500',
    PAID: 'text-emerald-500',
    OVERDUE: 'text-red-500',
    CANCELLED: 'text-gray-500',
  };
  return map[status] || 'text-gray-500';
}

export function getStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    PARTIAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}
