'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { CategoryBreakdown } from '@/lib/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface ExpensePieChartProps { data: CategoryBreakdown[]; }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: CategoryBreakdown }> }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0];
  return (
    <div className="bg-popover border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold">{d.name}</p>
      <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
      <p className="text-muted-foreground">{d.payload.percentage}%</p>
    </div>
  );
};

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  const sliced = data.slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
      </CardHeader>
      <CardContent>
        {sliced.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sliced} cx="50%" cy="50%" outerRadius={75} innerRadius={45} dataKey="amount" nameKey="categoryName" paddingAngle={2}>
                {sliced.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs">{value}</span>}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
