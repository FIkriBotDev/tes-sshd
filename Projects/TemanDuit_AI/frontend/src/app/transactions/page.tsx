'use client';
import { useEffect, useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { transactionApi, categoryApi, type TransactionWithCategory, type Category } from '@/lib/api';
import { formatCurrency, formatDate, getCurrentMonthYear, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function TransactionsPage() {
  const { refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', categoryId: '', description: '', note: '', date: '' });

  const fetchData = async () => {
    try {
      const [txRes, catRes] = await Promise.all([
        transactionApi.getAll({ limit: 50 }),
        categoryApi.getAll(),
      ]);
      setTransactions(txRes.data || []);
      setCategories(catRes.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.amount || !form.categoryId || !form.description) {
      toast.error('Lengkapi form');
      return;
    }
    try {
      await transactionApi.createExpense({
        amount: parseFloat(form.amount),
        categoryId: form.categoryId,
        description: form.description,
        note: form.note || undefined,
        date: form.date || undefined,
      });
      toast.success('Pengeluaran berhasil dicatat');
      setDialogOpen(false);
      setForm({ amount: '', categoryId: '', description: '', note: '', date: '' });
      fetchData();
      refreshProfile();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi?')) return;
    try {
      await transactionApi.deleteExpense(id);
      toast.success('Transaksi dihapus');
      fetchData();
      refreshProfile();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Transaksi"
        description="Semua pengeluaran dan pemasukan"
        action={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Tambah Pengeluaran</Button>}
      />

      {transactions.length === 0 ? (
        <EmptyState
          title="Belum Ada Transaksi"
          description="Mulai catat pengeluaran dan pemasukan Anda"
          action={{ label: 'Tambah Transaksi', onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn('p-2 rounded-lg', tx.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20')}>
                    {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{tx.categoryName}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatDate(tx.date, 'dd MMM yyyy')}</span>
                    </div>
                    {tx.note && <p className="text-xs text-muted-foreground mt-1">{tx.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-semibold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  {tx.type === 'expense' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(tx.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran</DialogTitle>
            <DialogDescription>Catat pengeluaran baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nominal *</Label>
              <Input type="number" placeholder="50000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
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
            <div>
              <Label>Deskripsi *</Label>
              <Input placeholder="Beli bakso" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Catatan</Label>
              <Textarea placeholder="Opsional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
