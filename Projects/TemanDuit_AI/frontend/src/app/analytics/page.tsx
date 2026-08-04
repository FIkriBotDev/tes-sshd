'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { DailyBarChart } from '@/components/charts/DailyBarChart';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { analyticsApi, type AnalyticsData } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName } from '@/lib/utils';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const { month, year } = getCurrentMonthYear();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await analyticsApi.getFull({ month, year });
        setData(res.data!);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gagal memuat analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <AppLayout><PageLoading /></AppLayout>;
  if (!data) return <AppLayout><div>Error loading analytics</div></AppLayout>;

  const { summary, incomeTrend, expenseTrend, savingTrend, budgetTrend, dailySpending, categoryBreakdown } = data;

  return (
    <AppLayout>
      <PageHeader title="Analytics" description={`Analisis keuangan ${getMonthName(month)} ${year}`} />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          { label: 'Total Income', value: summary.totalIncome, color: 'text-emerald-600' },
          { label: 'Total Expense', value: summary.totalExpense, color: 'text-red-600' },
          { label: 'Net Savings', value: summary.netSavings, color: summary.netSavings >= 0 ? 'text-emerald-600' : 'text-red-600' },
          { label: 'Saving Rate', value: `${summary.savingRate}%`, isPercent: true, color: 'text-blue-600' },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>
                {item.isPercent ? item.value : formatCurrency(item.value as number)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <CashFlowChart income={incomeTrend} expense={expenseTrend} />
        <ExpensePieChart data={categoryBreakdown} />
      </div>

      {/* Trends */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <TrendLineChart
          title="Trend Pemasukan & Pengeluaran"
          datasets={[
            { data: incomeTrend, label: 'Pemasukan', color: '#10b981' },
            { data: expenseTrend, label: 'Pengeluaran', color: '#ef4444' },
          ]}
        />
        <TrendLineChart
          title="Trend Tabungan & Budget"
          datasets={[
            { data: savingTrend, label: 'Tabungan', color: '#8b5cf6' },
            { data: budgetTrend, label: 'Budget Usage', color: '#f59e0b' },
          ]}
        />
      </div>

      {/* Daily & Calendar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DailyBarChart data={dailySpending} />
        <HeatmapCalendar data={dailySpending} month={month} year={year} />
      </div>

      {/* Detail Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Detail Statistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Budget Usage', value: `${summary.budgetUsage}%` },
              { label: 'Avg. Daily Spending', value: formatCurrency(summary.averageDailySpending) },
              { label: 'Most Expensive', value: summary.mostExpensiveCategory },
              { label: 'Most Frequent', value: summary.mostFrequentCategory },
              { label: 'Current Balance', value: formatCurrency(summary.balance) },
              { label: 'Savings Balance', value: formatCurrency(summary.savingBalance) },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-semibold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
