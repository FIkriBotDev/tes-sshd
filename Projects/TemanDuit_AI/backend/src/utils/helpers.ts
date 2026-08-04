import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Timezone } from '../types';

export const generateId = (): string => uuidv4();

export const TIMEZONE_MAP: Record<Timezone, string> = {
  WIB: 'Asia/Jakarta',
  WITA: 'Asia/Makassar',
  WIT: 'Asia/Jayapura',
};

export const nowISO = (): string => new Date().toISOString();

export const getZonedNow = (timezone: Timezone): Date => {
  const tz = TIMEZONE_MAP[timezone];
  return toZonedTime(new Date(), tz);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date, timezone: Timezone = 'WIB'): string => {
  const tz = TIMEZONE_MAP[timezone];
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(toZonedTime(d, tz), 'dd MMM yyyy HH:mm', { timeZone: tz });
};

export const formatDateShort = (date: string | Date, timezone: Timezone = 'WIB'): string => {
  const tz = TIMEZONE_MAP[timezone];
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(toZonedTime(d, tz), 'dd MMM yyyy', { timeZone: tz });
};

export const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const getPeriodString = (): string => {
  const { month, year } = getCurrentMonthYear();
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const sanitizeNumber = (input: unknown): number => {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.abs(Math.round(num * 100) / 100);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const percentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
};
