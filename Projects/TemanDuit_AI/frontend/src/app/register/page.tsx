'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Informasi Dasar', fields: ['name', 'age', 'timezone'] },
  { id: 2, title: 'Informasi Keuangan', fields: ['occupation', 'incomeSource', 'financialGoal'] },
];

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const token = searchParams.get('token') || '';

  const [step, setStep] = useState(1);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '', age: '', timezone: 'WIB',
    occupation: '', incomeSource: '', financialGoal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) { setValidating(false); return; }
    authApi.validateToken(token)
      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.name.trim()) errs.name = 'Nama tidak boleh kosong';
      if (!form.age) errs.age = 'Umur diperlukan';
      else if (parseInt(form.age) < 10 || parseInt(form.age) > 120) errs.age = 'Umur tidak valid';
      if (!form.timezone) errs.timezone = 'Zona waktu diperlukan';
    } else {
      if (!form.occupation.trim()) errs.occupation = 'Pekerjaan diperlukan';
      if (!form.incomeSource.trim()) errs.incomeSource = 'Sumber penghasilan diperlukan';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(2);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await authApi.register({
        token,
        name: form.name,
        age: parseInt(form.age),
        timezone: form.timezone as 'WIB' | 'WITA' | 'WIT',
        occupation: form.occupation,
        incomeSource: form.incomeSource,
        financialGoal: form.financialGoal || undefined,
      });
      if (res.data) {
        setAuth(res.data.user, res.data.token);
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registrasi gagal');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link Tidak Valid</h2>
            <p className="text-muted-foreground">Link registrasi tidak valid atau sudah kedaluwarsa. Mulai ulang bot Telegram dengan mengetik /start.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Registrasi Berhasil! 🎉</h2>
              <p className="text-muted-foreground">Akun TemanDuit kamu sudah siap. Mengalihkan ke dashboard...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold">Daftar TemanDuit</h1>
          <p className="text-muted-foreground mt-1">Asisten keuangan AI pribadimu 💰</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-2">
              {STEPS.map((s) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                  {s.id < STEPS.length && <div className={`flex-1 h-0.5 ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>
            <CardTitle className="text-lg">{STEPS[step - 1].title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <Label>Nama Lengkap *</Label>
                  <Input placeholder="Budi Santoso" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label>Umur *</Label>
                  <Input type="number" placeholder="25" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                  {errors.age && <p className="text-destructive text-xs mt-1">{errors.age}</p>}
                </div>
                <div>
                  <Label>Zona Waktu *</Label>
                  <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIB">WIB - Waktu Indonesia Barat (Jakarta)</SelectItem>
                      <SelectItem value="WITA">WITA - Waktu Indonesia Tengah (Makassar)</SelectItem>
                      <SelectItem value="WIT">WIT - Waktu Indonesia Timur (Jayapura)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Pekerjaan *</Label>
                  <Input placeholder="Software Engineer" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                  {errors.occupation && <p className="text-destructive text-xs mt-1">{errors.occupation}</p>}
                </div>
                <div>
                  <Label>Sumber Penghasilan *</Label>
                  <Input placeholder="Karyawan tetap, freelance, usaha..." value={form.incomeSource} onChange={(e) => setForm({ ...form, incomeSource: e.target.value })} />
                  {errors.incomeSource && <p className="text-destructive text-xs mt-1">{errors.incomeSource}</p>}
                </div>
                <div>
                  <Label>Target Keuangan (opsional)</Label>
                  <Textarea
                    placeholder="Contoh: Menabung untuk beli rumah dalam 5 tahun, membayar cicilan mobil..."
                    value={form.financialGoal}
                    onChange={(e) => setForm({ ...form, financialGoal: e.target.value })}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Kembali</Button>
            )}
            {step < 2 ? (
              <Button className="flex-1" onClick={handleNext}>Lanjut →</Button>
            ) : (
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mendaftar...</> : 'Daftar Sekarang 🚀'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
