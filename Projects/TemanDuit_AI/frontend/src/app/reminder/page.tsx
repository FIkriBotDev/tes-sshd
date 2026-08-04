'use client';
import { useEffect, useState } from 'react';
import { Plus, Bell, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reminderApi, type Reminder } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

const FREQ_LABELS: Record<string, string> = { once: 'Sekali', daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' };
const TYPE_LABELS: Record<string, string> = { bill: 'Tagihan', debt: 'Hutang', installment: 'Cicilan', budget: 'Budget', saving: 'Tabungan', custom: 'Custom' };
const TYPE_ICONS: Record<string, string> = { bill: '📄', debt: '💳', installment: '📅', budget: '💰', saving: '🏦', custom: '🔔' };

export default function ReminderPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState({ type: 'custom', title: '', description: '', amount: '', frequency: 'once', dueDate: '' });

  const fetchData = async () => {
    try {
      const res = await reminderApi.getAll();
      setReminders(res.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ type: 'custom', title: '', description: '', amount: '', frequency: 'once', dueDate: '' });
    setDialogOpen(true);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    setForm({
      type: r.type, title: r.title, description: r.description || '',
      amount: r.amount ? String(r.amount) : '', frequency: r.frequency,
      dueDate: r.dueDate ? r.dueDate.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.dueDate) { toast.error('Lengkapi form'); return; }
    try {
      const payload = {
        type: form.type, title: form.title,
        description: form.description || undefined,
        amount: form.amount ? parseFloat(form.amount) : undefined,
        frequency: form.frequency, dueDate: form.dueDate,
      };
      if (editing) {
        await reminderApi.update(editing.id, payload);
        toast.success('Reminder diperbarui');
      } else {
        await reminderApi.create(payload);
        toast.success('Reminder berhasil dibuat');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleToggle = async (r: Reminder) => {
    try {
      await reminderApi.update(r.id, { isActive: !r.isActive });
      toast.success(r.isActive ? 'Reminder dinonaktifkan' : 'Reminder diaktifkan');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus reminder ini?')) return;
    try {
      await reminderApi.delete(id);
      toast.success('Reminder dihapus');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  const activeCount = reminders.filter((r) => r.isActive).length;

  return (
    <AppLayout>
      <PageHeader
        title="Reminder"
        description={`${activeCount} reminder aktif`}
        action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Buat Reminder</Button>}
      />

      {reminders.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-muted-foreground" />}
          title="Belum Ada Reminder"
          description="Buat pengingat untuk tagihan, hutang, atau hal penting lainnya"
          action={{ label: 'Buat Reminder', onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reminders.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className={cn('transition-shadow hover:shadow-md', !r.isActive && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{TYPE_ICONS[r.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{r.title}</p>
                        {r.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.description}</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{TYPE_LABELS[r.type]}</Badge>
                          <Badge variant="outline" className="text-[10px]">{FREQ_LABELS[r.frequency]}</Badge>
                          {r.amount && <Badge variant="outline" className="text-[10px]">{formatCurrency(r.amount)}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          📅 {formatDate(r.nextTrigger, 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(r)} title={r.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                        {r.isActive ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
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
            <DialogTitle>{editing ? 'Edit Reminder' : 'Buat Reminder'}</DialogTitle>
            <DialogDescription>Atur pengingat untuk jadwal penting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipe</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{TYPE_ICONS[k]} {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Judul *</Label>
              <Input placeholder="Bayar listrik" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input placeholder="Opsional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Nominal</Label>
              <Input type="number" placeholder="Opsional" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label>Pengulangan</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQ_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal & Waktu *</Label>
              <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
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
