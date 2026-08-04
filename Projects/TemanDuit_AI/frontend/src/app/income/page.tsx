'use client';
import { useEffect, useState } from 'react';
import { Plus, ArrowUpRight, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { transactionApi, type TransactionWithCategory } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const INCOME_SOURCES = [
  { value: 'salary', label: 'Gaji' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'thr', label: 'THR' },
  { value: 'refund', label: 'Refund' },
  { value: 'gift', label: 'Hadiah' },
  { value: 'business', label: 'Usaha' },
  { value: 'other', label: 'Lainnya' },
];

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(INCOME_SOURCES.map((s) => [s.value, s.label]));
const SOURCE_COLORS: Record<string, string> = {
  salary: 'success', bonus: 'success', freelance: 'warning', thr: 'success',
  refund: 'secondary', gift: 'secondary', business: 'warning', other: 'secondary',
};

export default function IncomePage() {
  const { refreshProfile } = useAuth();
  const [incomes, setIncomes] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', source: '', description: '', note: '', date: '' });

  const fetchData = async () => {
    try {
      const res = await transactionApi.getAll({ type: 'income', limit: 50 });
      setIncomes(res.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.amount || !form.source || !form.description) {
      toast.error('Lengkapi form terlebih dahulu');
      return;
    }
    try {
      await transactionApi.createIncome({
        amount: parseFloat(form.amount),
        source: form.source,
        description: form.description,
        note: form.note || undefined,
        date: form.date || undefined,
      });
      toast.success('Pemasukan berhasil dicatat');
      setDialogOpen(false);
      setForm({ amount: '', source: '', description: '', note: '', date: '' });
      fetchData();
      refreshProfile();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pemasukan ini?')) return;
    try {
      await transactionApi.deleteIncome(id);
      toast.success('Pemasukan dihapus');
      fetchData();
      refreshProfile();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Pemasukan"
        description="Kelola semua sumber pemasukan Anda"
        action={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Tambah Pemasukan</Button>}
      />

      {/* Summary Card */}
      <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pemasukan Bulan Ini</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</p>
              <p className="text-sm text-muted-foreground mt-1">{incomes.length} transaksi</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
              <ArrowUpRight className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {incomes.length === 0 ? (
        <EmptyState
          title="Belum Ada Pemasukan"
          description="Catat pemasukan seperti gaji, bonus, atau freelance"
          action={{ label: 'Catat Pemasukan', onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {incomes.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant={(SOURCE_COLORS[tx.source || 'other'] as 'success' | 'warning' | 'secondary') || 'secondary'} className="text-[10px] h-4">
                      {SOURCE_LABELS[tx.source || 'other'] || 'Lainnya'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                  </div>
                  {tx.note && <p className="text-xs text-muted-foreground mt-0.5">{tx.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(tx.amount)}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(tx.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pemasukan</DialogTitle>
            <DialogDescription>Catat pemasukan baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nominal *</Label>
              <Input type="number" placeholder="5000000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Sumber *</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih sumber" /></SelectTrigger>
                <SelectContent>
                  {INCOME_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deskripsi *</Label>
              <Input placeholder="Gaji bulan Juli" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
