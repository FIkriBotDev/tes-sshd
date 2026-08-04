'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyCompact, formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { DailySpending } from '@/lib/api';

interface DailyBarChartProps { data: DailySpending[]; title?: string; }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export function DailyBarChart({ data, title = 'Pengeluaran Harian' }: DailyBarChartProps) {
  const chartData = data.map((d) => ({
    date: format(parseISO(d.date), 'dd'),
    amount: d.amount,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyCompact} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
