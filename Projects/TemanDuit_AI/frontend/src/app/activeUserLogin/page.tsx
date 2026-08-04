'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import Link from 'next/link';

const BOT_URL = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/TemanDuitBot';

export default function ActiveUserLoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  // 8 input boxes untuk kode
  const [digits, setDigits] = useState<string[]>(Array(8).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) { router.replace('/dashboard'); return; }
    // Auto-focus input pertama
    inputRefs.current[0]?.focus();
  }, [isAuthenticated, router]);

  const code = digits.join('').toUpperCase();
  const isFull = code.length === 8;

  const handleDigitChange = (index: number, value: string) => {
    // Hanya terima alfanumerik, uppercase
    const char = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError('');

    // Auto-focus next
    if (char && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 7) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter' && isFull) {
      handleLogin();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8);

    const newDigits = Array(8).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    setError('');

    // Focus ke kotak setelah karakter terakhir
    const nextIdx = Math.min(pasted.length, 7);
    setTimeout(() => inputRefs.current[nextIdx]?.focus(), 0);
  };

  const handleLogin = async () => {
    if (!isFull) { setError('Masukkan 8 karakter kode login'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.loginWithCode(code);
      if (res.data) {
        setAuth(res.data.user, res.data.token);
        toast.success(res.message || `Selamat datang kembali! 👋`);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Kode tidak valid');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setDigits(Array(8).fill(''));
    setError('');
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold">Login TemanDuit</h1>
          <p className="text-muted-foreground mt-1 text-sm">Masukkan kode login Anda</p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
            </div>

            <h2 className="text-center text-lg font-semibold mb-1">Masukkan Kode Login</h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Kode 8 karakter yang didapat saat registrasi
            </p>

            {/* 8-digit input boxes */}
            <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-10 h-12 text-center text-lg font-bold font-mono uppercase border-2 rounded-lg bg-background transition-all outline-none
                    ${d ? 'border-primary text-primary' : 'border-input text-muted-foreground'}
                    ${error ? 'border-destructive' : ''}
                    focus:border-primary focus:ring-2 focus:ring-primary/20`}
                />
              ))}
            </div>

            {/* Divider visual */}
            <div className="flex justify-center gap-2 mb-5">
              <span className="w-20 h-0.5 bg-muted rounded" />
              <span className="text-xs text-muted-foreground">—</span>
              <span className="w-20 h-0.5 bg-muted rounded" />
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center mb-4 font-medium"
              >
                {error}
              </motion.p>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleLogin}
                disabled={!isFull || loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Memverifikasi...</>
                ) : (
                  'Login ke Dashboard →'
                )}
              </Button>

              {isFull && (
                <Button variant="ghost" className="w-full text-sm" onClick={handleClear}>
                  Hapus & Ulangi
                </Button>
              )}
            </div>

            {/* Hint */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Tidak punya kode?</p>
              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 mt-0.5 text-[#229ED9] flex-shrink-0" />
                <p>
                  Ketik{' '}
                  <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary border">
                    /akundashboard
                  </code>{' '}
                  di{' '}
                  <a href={BOT_URL} target="_blank" rel="noopener noreferrer"
                    className="text-[#229ED9] font-medium hover:underline">
                    Telegram Bot
                  </a>{' '}
                  untuk mendapatkan kode baru.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to login */}
        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke halaman login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
