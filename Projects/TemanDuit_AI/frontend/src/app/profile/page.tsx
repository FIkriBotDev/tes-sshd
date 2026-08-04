'use client';
import { useState } from 'react';
import { User, Pencil, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    age: String(user?.age || ''),
    timezone: user?.timezone || 'WIB',
    occupation: user?.occupation || '',
    incomeSource: user?.incomeSource || '',
    financialGoal: user?.financialGoal || '',
  });

  const handleSave = async () => {
    try {
      const res = await authApi.updateProfile({
        name: form.name,
        age: parseInt(form.age),
        timezone: form.timezone as 'WIB' | 'WITA' | 'WIT',
        occupation: form.occupation,
        incomeSource: form.incomeSource,
        financialGoal: form.financialGoal || undefined,
      });
      if (res.data) setUser(res.data);
      setEditing(false);
      toast.success('Profil berhasil diperbarui');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      <PageHeader
        title="Profil"
        description="Informasi akun dan preferensi keuangan"
        action={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Batal</Button>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Simpan</Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-2" />Edit Profil</Button>
          )
        }
      />

      <div className="grid gap-6 max-w-2xl">
        {/* Avatar Card */}
        <Card>
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.occupation}</p>
              <p className="text-sm text-muted-foreground mt-1">Bergabung {formatDate(user.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Saldo Utama</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(user.balance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Tabungan</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(user.savingBalance)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Lengkap</Label>
                {editing ? (
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                ) : (
                  <p className="mt-1 text-sm font-medium">{user.name}</p>
                )}
              </div>
              <div>
                <Label>Umur</Label>
                {editing ? (
                  <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                ) : (
                  <p className="mt-1 text-sm font-medium">{user.age} tahun</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pekerjaan</Label>
                {editing ? (
                  <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                ) : (
                  <p className="mt-1 text-sm font-medium">{user.occupation}</p>
                )}
              </div>
              <div>
                <Label>Zona Waktu</Label>
                {editing ? (
                  <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIB">WIB (Jakarta)</SelectItem>
                      <SelectItem value="WITA">WITA (Makassar)</SelectItem>
                      <SelectItem value="WIT">WIT (Jayapura)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm font-medium">{user.timezone}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Sumber Penghasilan</Label>
              {editing ? (
                <Input value={form.incomeSource} onChange={(e) => setForm({ ...form, incomeSource: e.target.value })} />
              ) : (
                <p className="mt-1 text-sm font-medium">{user.incomeSource}</p>
              )}
            </div>

            <div>
              <Label>Target Keuangan</Label>
              {editing ? (
                <Textarea
                  placeholder="Contoh: Menabung untuk rumah dalam 3 tahun"
                  value={form.financialGoal}
                  onChange={(e) => setForm({ ...form, financialGoal: e.target.value })}
                />
              ) : (
                <p className="mt-1 text-sm font-medium">{user.financialGoal || '-'}</p>
              )}
            </div>

            <div>
              <Label>Telegram ID</Label>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{user.telegramId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
