'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { categoryApi, type Category } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName.trim()) { toast.error('Nama kategori diperlukan'); return; }
    try {
      const res = await categoryApi.create({ name: newCatName, icon: newCatIcon || undefined });
      if (res.data) setCategories((prev) => [...prev, res.data!]);
      setNewCatName('');
      setNewCatIcon('');
      toast.success('Kategori berhasil ditambahkan');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await categoryApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Kategori dihapus');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Pengaturan" description="Kelola preferensi aplikasi" />

      <div className="space-y-6 max-w-2xl">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tampilan</CardTitle>
            <CardDescription>Pilih tema yang sesuai preferensi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Terang', icon: Sun },
                { value: 'dark', label: 'Gelap', icon: Moon },
                { value: 'system', label: 'Sistem', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
                >
                  <Icon className={`h-6 w-6 ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${theme === value ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategori Kustom</CardTitle>
            <CardDescription>Tambahkan kategori pengeluaran khusus Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Ikon (emoji)" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} className="w-24" />
              <Input placeholder="Nama kategori" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1" />
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Default categories */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">KATEGORI DEFAULT</p>
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => c.isDefault).map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs">
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Custom categories */}
            {categories.filter((c) => !c.isDefault).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">KATEGORI KUSTOM</p>
                <div className="space-y-2">
                  {categories.filter((c) => !c.isDefault).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{c.icon} {c.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteCategory(c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">Telegram ID: {user?.telegramId}</p>
              </div>
            </div>
            <Button variant="destructive" className="w-full" onClick={() => { logout(); window.location.href = '/login'; }}>
              Keluar dari Akun
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
