'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, Eye, EyeOff, Copy, Check, KeyRound, MessageCircle } from 'lucide-react';
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
  { id: 1, title: 'Informasi Dasar' },
  { id: 2, title: 'Informasi Keuangan' },
];

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const token = searchParams.get('token') || '';

  const [step, setStep] = useState(1);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Setelah register berhasil
  const [loginCode, setLoginCode] = useState('');
  const [codeVisible, setCodeVisible] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeConfirmed, setCodeConfirmed] = useState(false);

  const [form, setForm] = useState({
    name: '', age: '', timezone: 'WIB',
    occupation: '', incomeSource: '', financialGoal: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) { setValidating(false); return; }
    console.log('[TemanDuit] API URL:', process.env.NEXT_PUBLIC_API_URL);
    authApi.validateToken(token)
      .then(() => setTokenValid(true))
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'Network error';
        setTokenError(msg);
        setTokenValid(false);
      })
      .finally(() => setValidating(false));
  }, [token]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.name.trim()) errs.name = 'Nama tidak boleh kosong';
      if (!form.age) errs.age = 'Umur diperlukan';
      else if (parseInt(form.age) < 10 || parseInt(form.age) > 120) errs.age = 'Umur tidak valid';
    } else {
      if (!form.occupation.trim()) errs.occupation = 'Pekerjaan diperlukan';
      if (!form.incomeSource.trim()) errs.incomeSource = 'Sumber penghasilan diperlukan';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate()) setStep(2); };

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
        setLoginCode(res.data.loginCode);
        // Tandai ke backend bahwa kode sudah ditampilkan
        authApi.markCodeShown().catch(() => {});
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registrasi gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(loginCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast.success('Kode disalin!');
    });
  };

  const handleConfirmAndGo = () => {
    router.push('/dashboard');
  };

  // ---- Loading ----
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---- Token tidak valid ----
  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link Tidak Valid</h2>
            <p className="text-muted-foreground mb-3">
              {tokenError || 'Link registrasi tidak valid atau sudah kedaluwarsa.'}
            </p>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono break-all">
              API: {process.env.NEXT_PUBLIC_API_URL || 'tidak terkonfigurasi'}
            </p>
            <p className="text-muted-foreground mt-3 text-sm">
              Mulai ulang bot Telegram dengan mengetik /start.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Sukses — tampilkan login code ----
  if (loginCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-emerald-200 dark:border-emerald-800 shadow-xl">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-9 w-9 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold">Registrasi Berhasil! 🎉</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Akun TemanDuit kamu sudah aktif
                </p>
              </div>

              {/* Kode Login */}
              <div className="bg-muted/60 border-2 border-dashed border-primary/30 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Kode Login Dashboard</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-2xl font-bold tracking-widest text-center py-3 bg-background rounded-lg border select-all">
                    {codeVisible ? loginCode : '• • • • • • • •'}
                  </div>
                  <button
                    onClick={() => setCodeVisible((v) => !v)}
                    className="p-2.5 rounded-lg hover:bg-accent transition-colors"
                    title={codeVisible ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {codeVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-lg hover:bg-accent transition-colors"
                    title="Salin kode"
                  >
                    {codeCopied ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Gunakan kode ini untuk login ke dashboard kapan saja
                </p>
              </div>

              {/* Peringatan */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-5">
                <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                  ⚠️ Simpan kode ini sekarang! Kode hanya ditampilkan sekali di sini.
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Jika lupa, ketik <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded font-mono">/akundashboard</code> di Telegram untuk mendapatkan kode baru.
                </p>
              </div>

              {/* Info: kode juga dikirim via Telegram */}
              <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-5">
                <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Kode juga sudah dikirimkan ke akun Telegram kamu sebagai backup.
                </p>
              </div>

              {/* Checkbox konfirmasi */}
              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <input
                  type="checkbox"
                  checked={codeConfirmed}
                  onChange={(e) => setCodeConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Saya sudah menyimpan kode login dan mengerti cara menggunakannya
                </span>
              </label>

              <Button
                className="w-full"
                size="lg"
                disabled={!codeConfirmed}
                onClick={handleConfirmAndGo}
              >
                Masuk ke Dashboard →
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ---- Form Registrasi ----
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
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
                  {s.id < STEPS.length && (
                    <div className={`flex-1 h-0.5 ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
            <CardTitle className="text-lg">{STEPS[step - 1].title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <Label>Nama Lengkap *</Label>
                    <Input
                      placeholder="Budi Santoso"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label>Umur *</Label>
                    <Input
                      type="number"
                      placeholder="25"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
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
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <Label>Pekerjaan *</Label>
                    <Input
                      placeholder="Software Engineer"
                      value={form.occupation}
                      onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    />
                    {errors.occupation && <p className="text-destructive text-xs mt-1">{errors.occupation}</p>}
                  </div>
                  <div>
                    <Label>Sumber Penghasilan *</Label>
                    <Input
                      placeholder="Karyawan tetap, freelance, usaha..."
                      value={form.incomeSource}
                      onChange={(e) => setForm({ ...form, incomeSource: e.target.value })}
                    />
                    {errors.incomeSource && <p className="text-destructive text-xs mt-1">{errors.incomeSource}</p>}
                  </div>
                  <div>
                    <Label>Target Keuangan (opsional)</Label>
                    <Textarea
                      placeholder="Menabung untuk beli rumah dalam 5 tahun..."
                      value={form.financialGoal}
                      onChange={(e) => setForm({ ...form, financialGoal: e.target.value })}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                ← Kembali
              </Button>
            )}
            {step < 2 ? (
              <Button className="flex-1" onClick={handleNext}>
                Lanjut →
              </Button>
            ) : (
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mendaftar...</>
                ) : (
                  'Daftar Sekarang 🚀'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
