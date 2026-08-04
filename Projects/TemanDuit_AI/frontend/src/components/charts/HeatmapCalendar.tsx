'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import type { DailySpending } from '@/lib/api';

interface HeatmapCalendarProps { data: DailySpending[]; month: number; year: number; }

export function HeatmapCalendar({ data, month, year }: HeatmapCalendarProps) {
  const { days, maxAmount, cells } = useMemo(() => {
    const start = startOfMonth(new Date(year, month - 1, 1));
    const end = endOfMonth(start);
    const days = eachDayOfInterval({ start, end });
    const dataMap = Object.fromEntries(data.map((d) => [d.date, d.amount]));
    const maxAmount = Math.max(...Object.values(dataMap), 1);
    const firstDayOffset = getDay(start);
    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOffset; i++) {
      cells.push({ date: null, amount: 0, intensity: 0 });
    }

    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const amount = dataMap[dateStr] || 0;
      cells.push({ date: day, dateStr, amount, intensity: amount / maxAmount });
    }

    return { days, maxAmount, cells };
  }, [data, month, year]);

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted';
    if (intensity < 0.25) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (intensity < 0.5) return 'bg-emerald-300 dark:bg-emerald-700/60';
    if (intensity < 0.75) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Kalender Pengeluaran</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayLabels.map((d) => (
            <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
          ))}
          {cells.map((cell, i) => (
            <div
              key={i}
              title={cell.date ? `${format(cell.date, 'dd MMM')}: ${formatCurrency(cell.amount)}` : ''}
              className={`aspect-square rounded-sm ${getColor(cell.intensity)} flex items-center justify-center cursor-default`}
            >
              {cell.date && (
                <span className={`text-[9px] font-medium ${cell.intensity > 0.5 ? 'text-white' : 'text-muted-foreground'}`}>
                  {format(cell.date, 'd')}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-xs text-muted-foreground">Rendah</span>
          {[0, 0.25, 0.5, 0.75, 1].map((i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${getColor(i === 0 ? 0 : i)}`} />
          ))}
          <span className="text-xs text-muted-foreground">Tinggi</span>
        </div>
      </CardContent>
    </Card>
  );
}
