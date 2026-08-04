'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { dashboardApi, type DashboardData } from '@/lib/api';
import { formatCurrency, formatRelativeTime, formatDate, percentage, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.get();
        setData(res.data!);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gagal memuat dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <AppLayout><PageLoading /></AppLayout>;
  if (!data) return <AppLayout><div>Error loading dashboard</div></AppLayout>;

  const { summary, recentTransactions, budgets, notifications, upcomingReminders, savingGoals, categoryBreakdown, cashFlowTrend } = data;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang, {data.user.name}! 👋</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Saldo Utama" value={summary.balance} icon={<Wallet />} color="green" index={0} />
          <StatCard title="Pemasukan Bulan Ini" value={summary.totalIncome} icon={<TrendingUp />} color="blue" subtitle={`Saving rate: ${summary.savingRate}%`} index={1} />
          <StatCard title="Pengeluaran Bulan Ini" value={summary.totalExpense} icon={<TrendingDown />} color="red" subtitle={`Budget: ${summary.budgetUsage}%`} index={2} />
          <StatCard title="Tabungan" value={summary.savingBalance} icon={<PiggyBank />} color="purple" index={3} />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <CashFlowChart income={cashFlowTrend.income} expense={cashFlowTrend.expense} />
          <ExpensePieChart data={categoryBreakdown} />
        </div>

        {/* Content Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/transactions'}>Lihat Semua</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada transaksi</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn('p-2 rounded-lg', tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
                        {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{tx.categoryName}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <p className={cn('text-sm font-semibold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Budgets & Notifications */}
          <div className="space-y-4">
            {/* Budget Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Budget Bulan Ini</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {budgets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Belum ada budget</p>
                ) : (
                  budgets.slice(0, 3).map((b) => (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{b.categoryName}</span>
                        <span className={cn('text-xs font-semibold', b.isExceeded ? 'text-red-600' : b.isWarning ? 'text-orange-600' : 'text-muted-foreground')}>
                          {b.usagePercent}%
                        </span>
                      </div>
                      <Progress value={b.usagePercent} indicatorClassName={b.isExceeded ? 'bg-red-500' : b.isWarning ? 'bg-orange-500' : 'bg-primary'} />
                      <p className="text-xs text-muted-foreground">{formatCurrency(b.remaining)} tersisa</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            {notifications.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Notifikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {notifications.slice(0, 3).map((n) => (
                    <div key={n.id} className="p-2 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Saving Goals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Target Tabungan</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/saving'}>Lihat Semua</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {savingGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Belum ada target tabungan</p>
              ) : (
                savingGoals.map((g) => {
                  const pct = percentage(g.currentAmount, g.targetAmount);
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{g.name}</span>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} />
                      <p className="text-xs text-muted-foreground">{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Reminder Mendatang</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/reminder'}>Lihat Semua</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Tidak ada reminder</p>
              ) : (
                upcomingReminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.nextTrigger)}</p>
                    </div>
                    {r.amount && <Badge variant="outline">{formatCurrency(r.amount)}</Badge>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insight Teaser */}
        <Card className="gradient-card border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">💡 AI Financial Insight</h3>
              <p className="text-sm text-muted-foreground mb-4">Dapatkan analisis keuangan dan rekomendasi dari AI</p>
              <Button variant="gradient" size="sm" onClick={() => window.location.href = '/ai-insight'}>Lihat Insight</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
