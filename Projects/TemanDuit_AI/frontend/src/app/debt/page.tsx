'use client';
import { useEffect, useState } from 'react';
import { Plus, CreditCard, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { debtApi, type Debt, type DebtSummary } from '@/lib/api';
import { formatCurrency, formatDate, getStatusBadgeColor, percentage, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [form, setForm] = useState({ type: 'debt', counterpartyName: '', amount: '', description: '', dueDate: '' });
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      const [debtsRes, sumRes] = await Promise.all([debtApi.getAll(), debtApi.getSummary()]);
      setDebts(debtsRes.data || []);
      setSummary(sumRes.data!);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.counterpartyName || !form.amount || !form.description) {
      toast.error('Lengkapi form');
      return;
    }
    try {
      await debtApi.create({
        type: form.type as 'debt' | 'receivable' | 'installment',
        counterpartyName: form.counterpartyName,
        amount: parseFloat(form.amount),
        description: form.description,
        dueDate: form.dueDate || undefined,
      });
      toast.success('Hutang berhasil dicatat');
      setCreateOpen(false);
      setForm({ type: 'debt', counterpartyName: '', amount: '', description: '', dueDate: '' });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handlePayment = async () => {
    if (!payAmount || !selectedDebt) { toast.error('Masukkan nominal pembayaran'); return; }
    try {
      await debtApi.recordPayment(selectedDebt.id, { amount: parseFloat(payAmount), note: payNote || undefined });
      toast.success('Pembayaran berhasil dicatat');
      setPaymentOpen(false);
      setPayAmount('');
      setPayNote('');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat pembayaran');
    }
  };

  const filtered = filter === 'all' ? debts : debts.filter((d) => {
    if (filter === 'active') return d.status === 'ACTIVE' || d.status === 'PARTIAL';
    if (filter === 'overdue') return d.status === 'OVERDUE';
    if (filter === 'paid') return d.status === 'PAID';
    return true;
  });

  const TYPE_LABEL: Record<string, string> = { debt: 'Hutang', receivable: 'Piutang', installment: 'Cicilan' };

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Hutang & Piutang"
        description="Kelola hutang, piutang, dan cicilan"
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Tambah</Button>}
      />

      {/* Summary */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[
            { label: 'Total Hutang', value: summary.totalDebt, color: 'text-red-600' },
            { label: 'Total Piutang', value: summary.totalReceivable, color: 'text-emerald-600' },
            { label: 'Hutang Aktif', value: summary.activeCount, isCount: true, color: 'text-yellow-600' },
            { label: 'Jatuh Tempo', value: summary.overdueCount, isCount: true, color: 'text-red-600' },
          ].map((item, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold mt-1 ${item.color}`}>
                  {item.isCount ? item.value : formatCurrency(item.value as number)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'active', 'overdue', 'paid'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : f === 'overdue' ? 'Jatuh Tempo' : 'Lunas'}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak Ada Data"
          description="Tidak ada hutang yang sesuai filter"
          action={{ label: 'Tambah Hutang', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((debt, i) => {
            const pct = percentage(debt.paidAmount, debt.amount);
            return (
              <motion.div key={debt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={cn('hover:shadow-md transition-shadow', debt.status === 'OVERDUE' && 'border-red-300 dark:border-red-800')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{debt.counterpartyName}</span>
                          <Badge className={getStatusBadgeColor(debt.status)}>{debt.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{debt.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {TYPE_LABEL[debt.type]} • {debt.dueDate ? `Jatuh tempo: ${formatDate(debt.dueDate)}` : 'Tanpa jatuh tempo'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(debt.remainingAmount)}</p>
                        <p className="text-xs text-muted-foreground">dari {formatCurrency(debt.amount)}</p>
                      </div>
                    </div>
                    <Progress value={pct} indicatorClassName={pct >= 100 ? 'bg-emerald-500' : 'bg-primary'} />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">Terbayar: {formatCurrency(debt.paidAmount)}</p>
                      {(debt.status === 'ACTIVE' || debt.status === 'PARTIAL' || debt.status === 'OVERDUE') && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedDebt(debt); setPaymentOpen(true); }}>
                          <Minus className="h-3 w-3 mr-1" /> Bayar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Hutang / Piutang</DialogTitle>
            <DialogDescription>Tambahkan hutang, piutang, atau cicilan baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipe *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debt">Hutang (saya yang berhutang)</SelectItem>
                  <SelectItem value="receivable">Piutang (orang lain yang berhutang)</SelectItem>
                  <SelectItem value="installment">Cicilan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.type === 'debt' ? 'Nama Pemberi Hutang' : 'Nama Peminjam'} *</Label>
              <Input placeholder="Nama" value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} />
            </div>
            <div>
              <Label>Nominal *</Label>
              <Input type="number" placeholder="1000000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Keterangan *</Label>
              <Input placeholder="Hutang untuk..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Jatuh Tempo</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={handleCreate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>{selectedDebt?.counterpartyName} — Sisa: {formatCurrency(selectedDebt?.remainingAmount || 0)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nominal Pembayaran *</Label>
              <Input type="number" placeholder={String(selectedDebt?.remainingAmount || '')} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div>
              <Label>Catatan</Label>
              <Input placeholder="Opsional" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Batal</Button>
            <Button onClick={handlePayment}>Catat Pembayaran</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
