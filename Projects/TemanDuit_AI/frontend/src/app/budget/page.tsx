'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { budgetApi, categoryApi, type BudgetWithMeta, type Category } from '@/lib/api';
import { formatCurrency, getCurrentMonthYear, getMonthName, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function BudgetPage() {
  const { month, year } = getCurrentMonthYear();
  const [budgets, setBudgets] = useState<BudgetWithMeta[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithMeta | null>(null);
  const [form, setForm] = useState({ categoryId: '', amount: '', rollover: false });

  const fetchData = async () => {
    try {
      const [budRes, catRes] = await Promise.all([
        budgetApi.getAll({ month, year }),
        categoryApi.getAll(),
      ]);
      setBudgets(budRes.data || []);
      setCategories(catRes.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryId: '', amount: '', rollover: false });
    setDialogOpen(true);
  };

  const openEdit = (b: BudgetWithMeta) => {
    setEditing(b);
    setForm({ categoryId: b.categoryId, amount: String(b.amount), rollover: b.rollover });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.categoryId || !form.amount) { toast.error('Lengkapi form'); return; }
    try {
      if (editing) {
        await budgetApi.update(editing.id, { amount: parseFloat(form.amount), rollover: form.rollover });
        toast.success('Budget diperbarui');
      } else {
        await budgetApi.create({ categoryId: form.categoryId, amount: parseFloat(form.amount), month, year, rollover: form.rollover });
        toast.success('Budget berhasil dibuat');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus budget ini?')) return;
    try {
      await budgetApi.delete(id);
      toast.success('Budget dihapus');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Budget"
        description={`Kelola anggaran ${getMonthName(month)} ${year}`}
        action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Buat Budget</Button>}
      />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[
          { label: 'Total Budget', value: totalBudgeted, color: 'text-blue-600' },
          { label: 'Terpakai', value: totalSpent, color: 'text-red-600' },
          { label: 'Tersisa', value: totalRemaining, color: totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600' },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{formatCurrency(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          title="Belum Ada Budget"
          description="Buat anggaran untuk mengontrol pengeluaran bulanan Anda"
          action={{ label: 'Buat Budget', onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn('transition-shadow hover:shadow-md', b.isExceeded && 'border-red-300 dark:border-red-800')}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.categoryIcon || '📦'}</span>
                      <div>
                        <p className="font-semibold">{b.categoryName}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {b.isExceeded && <Badge variant="danger">Melebihi</Badge>}
                      {b.isWarning && !b.isExceeded && <Badge variant="warning">Hampir</Badge>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={b.usagePercent}
                    indicatorClassName={b.isExceeded ? 'bg-red-500' : b.isWarning ? 'bg-orange-500' : 'bg-primary'}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">Tersisa: <span className={cn('font-medium', b.remaining > 0 ? 'text-emerald-600' : 'text-red-600')}>{formatCurrency(b.remaining)}</span></p>
                    <p className="text-xs font-semibold">{b.usagePercent}%</p>
                  </div>
                  {b.rollover && <p className="text-xs text-muted-foreground mt-1">🔄 Rollover aktif</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Budget' : 'Buat Budget'}</DialogTitle>
            <DialogDescription>Budget untuk {getMonthName(month)} {year}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div>
                <Label>Kategori *</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Nominal Budget *</Label>
              <Input type="number" placeholder="500000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Rollover Sisa Budget</Label>
                <p className="text-xs text-muted-foreground">Sisa budget dilanjutkan ke bulan berikutnya</p>
              </div>
              <Switch checked={form.rollover} onCheckedChange={(v) => setForm({ ...form, rollover: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
