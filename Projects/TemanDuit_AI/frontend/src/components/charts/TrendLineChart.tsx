'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyCompact, getMonthName } from '@/lib/utils';
import type { TrendData } from '@/lib/api';

interface TrendLineChartProps {
  datasets: Array<{ data: TrendData[]; label: string; color: string }>;
  title: string;
}

export function TrendLineChart({ datasets, title }: TrendLineChartProps) {
  const periods = datasets[0]?.data.map((d) => d.period) || [];
  const chartData = periods.map((period, i) => {
    const row: Record<string, string | number> = { period };
    datasets.forEach((ds) => { row[ds.label] = ds.data[i]?.amount || 0; });
    return row;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => { const [, m] = v.split('-'); return getMonthName(parseInt(m || '1')); }}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCurrencyCompact} />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrencyCompact(value), name]}
              labelFormatter={(label) => { const [y, m] = label.split('-'); return `${getMonthName(parseInt(m || '1'))} ${y}`; }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {datasets.map((ds) => (
              <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={ds.color} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
