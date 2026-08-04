'use client';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyCompact, getMonthName } from '@/lib/utils';
import type { TrendData } from '@/lib/api';

interface CashFlowChartProps {
  income: TrendData[];
  expense: TrendData[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload) return null;
  const [y, m] = (label || '').split('-');
  const monthLabel = `${getMonthName(parseInt(m || '1'))} ${y}`;

  return (
    <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold mb-2">{monthLabel}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatCurrencyCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function CashFlowChart({ income, expense }: CashFlowChartProps) {
  const data = income.map((inc, i) => ({
    period: inc.period,
    Pemasukan: inc.amount,
    Pengeluaran: expense[i]?.amount || 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cash Flow 6 Bulan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => { const [, m] = v.split('-'); return getMonthName(parseInt(m || '1')); }}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCurrencyCompact} className="text-muted-foreground" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
