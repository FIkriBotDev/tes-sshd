'use client';
import { useEffect, useState } from 'react';
import { Plus, Target, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { savingApi, type SavingGoal, type SavingSummary } from '@/lib/api';
import { formatCurrency, formatDate, percentage, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function SavingPage() {
  const { user, refreshProfile } = useAuth();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [summary, setSummary] = useState<SavingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '' });
  const [txForm, setTxForm] = useState({ type: 'deposit', amount: '', description: '' });

  const fetchData = async () => {
    try {
      const [goalsRes, sumRes] = await Promise.all([savingApi.getGoals(), savingApi.getSummary()]);
      setGoals(goalsRes.data || []);
      setSummary(sumRes.data!);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateGoal = async () => {
    if (!form.name || !form.targetAmount) { toast.error('Lengkapi form'); return; }
    try {
      await savingApi.createGoal({
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        deadline: form.deadline || undefined,
      });
      toast.success('Target tabungan berhasil dibuat');
      setGoalDialogOpen(false);
      setForm({ name: '', targetAmount: '', deadline: '' });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleTransaction = async () => {
    if (!txForm.amount || !txForm.description) { toast.error('Lengkapi form'); return; }
    try {
      await savingApi.createTransaction({
        type: txForm.type as 'deposit' | 'withdrawal',
        amount: parseFloat(txForm.amount),
        description: txForm.description,
      });
      toast.success(txForm.type === 'deposit' ? 'Berhasil menabung' : 'Dana berhasil ditarik');
      setTxDialogOpen(false);
      setTxForm({ type: 'deposit', amount: '', description: '' });
      fetchData();
      refreshProfile();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Hapus target tabungan ini?')) return;
    try {
      await savingApi.deleteGoal(id);
      toast.success('Target tabungan dihapus');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Tabungan"
        description="Kelola tabungan dan target finansial"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGoalDialogOpen(true)}><Target className="h-4 w-4 mr-2" />Target Baru</Button>
            <Button onClick={() => { setTxForm({ ...txForm, type: 'deposit' }); setTxDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Tabung</Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="md:col-span-2 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tabungan</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrency(summary?.totalSaving || 0)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                <Target className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {[
          { label: 'Target Aktif', value: summary?.activeGoals || 0 },
          { label: 'Target Tercapai', value: summary?.completedGoals || 0 },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-2 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTxForm({ ...txForm, type: 'deposit' }); setTxDialogOpen(true); }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <ArrowDownToLine className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold">Setor Tabungan</p>
              <p className="text-xs text-muted-foreground">Pindahkan dana ke tabungan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTxForm({ ...txForm, type: 'withdrawal' }); setTxDialogOpen(true); }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <ArrowUpFromLine className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold">Tarik Tabungan</p>
              <p className="text-xs text-muted-foreground">Kembalikan dana ke saldo utama</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      <h3 className="text-lg font-semibold mb-3">Target Tabungan</h3>
      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-8 w-8 text-muted-foreground" />}
          title="Belum Ada Target"
          description="Buat target tabungan untuk mencapai tujuan finansial Anda"
          action={{ label: 'Buat Target', onClick: () => setGoalDialogOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g, i) => {
            const pct = percentage(g.currentAmount, g.targetAmount);
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={cn('hover:shadow-md transition-shadow', g.isCompleted && 'border-emerald-300 dark:border-emerald-800')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{g.name}</p>
                          {g.isCompleted && <Badge variant="success">✓ Tercapai</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">Target: {formatCurrency(g.targetAmount)}</p>
                        {g.deadline && <p className="text-xs text-muted-foreground mt-0.5">📅 {formatDate(g.deadline)}</p>}
                      </div>
                      {!g.isCompleted && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteGoal(g.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Progress value={pct} indicatorClassName={g.isCompleted ? 'bg-emerald-500' : 'bg-primary'} />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{formatCurrency(g.currentAmount)} terkumpul</p>
                      <p className="text-xs font-semibold">{pct}%</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Target Tabungan</DialogTitle>
            <DialogDescription>Tetapkan tujuan finansial baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Target *</Label>
              <Input placeholder="Dana Darurat" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Target Nominal *</Label>
              <Input type="number" placeholder="10000000" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
            </div>
            <div>
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateGoal}>Buat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{txForm.type === 'deposit' ? 'Setor Tabungan' : 'Tarik Tabungan'}</DialogTitle>
            <DialogDescription>Saldo saat ini: {formatCurrency(user?.balance || 0)} | Tabungan: {formatCurrency(user?.savingBalance || 0)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nominal *</Label>
              <Input type="number" placeholder="500000" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} />
            </div>
            <div>
              <Label>Deskripsi *</Label>
              <Input placeholder="Menabung untuk..." value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialogOpen(false)}>Batal</Button>
            <Button onClick={handleTransaction}>{txForm.type === 'deposit' ? 'Setor' : 'Tarik'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
