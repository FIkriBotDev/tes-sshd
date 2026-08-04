'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, TrendingUp, Shield, Zap, KeyRound, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const BOT_URL = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/TemanDuitBot';

  const features = [
    { icon: MessageCircle, title: 'Natural Language', desc: 'Catat keuangan dengan bahasa sehari-hari' },
    { icon: TrendingUp, title: 'Analitik Cerdas', desc: 'Dashboard lengkap dan insight otomatis' },
    { icon: Zap, title: 'AI Powered', desc: 'Rekomendasi keuangan personal dari AI' },
    { icon: Shield, title: 'Aman & Privat', desc: 'Data keuangan tersimpan aman' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left — Branding */}
      <div className="lg:w-1/2 gradient-primary flex flex-col justify-center p-8 lg:p-16 text-white">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">TemanDuit</h1>
          <p className="text-emerald-100 text-lg mb-10">AI Personal Finance Assistant</p>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-4 bg-white/10 rounded-xl"
              >
                <f.icon className="h-5 w-5 mb-2 text-emerald-200" />
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-emerald-200 text-xs mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Login options */}
      <div className="lg:w-1/2 flex flex-col justify-center p-8 lg:p-16">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md mx-auto w-full"
        >
          <h2 className="text-3xl font-bold mb-2">Selamat Datang 👋</h2>
          <p className="text-muted-foreground mb-8">
            Pilih cara masuk ke TemanDuit
          </p>

          <div className="space-y-4">
            {/* === OPSI 1: Login dengan kode unik (untuk user sudah terdaftar) === */}
            <Link href="/activeUserLogin" className="block">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between gap-4 p-5 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Login dengan Kode</p>
                    <p className="text-sm text-muted-foreground">Sudah punya akun? Masuk pakai kode unik</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">ATAU</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* === OPSI 2: Daftar baru via Telegram === */}
            <a href={BOT_URL} target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-3 bg-[#229ED9] hover:bg-[#1a8bbf] text-white font-semibold py-4 rounded-xl transition-colors shadow-lg"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
                </svg>
                Daftar via Telegram Bot
              </motion.button>
            </a>

            {/* Cara penggunaan */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground space-y-3">
              <div>
                <p className="font-semibold text-foreground mb-1">Sudah punya akun?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Klik <strong>Login dengan Kode</strong> di atas</li>
                  <li>Masukkan kode 8 karakter dari saat registrasi</li>
                  <li>Atau ketik <code className="bg-muted px-1 rounded">/akundashboard</code> di Telegram untuk kode baru</li>
                </ol>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold text-foreground mb-1">Belum punya akun?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Buka Telegram Bot dan ketik <code className="bg-muted px-1 rounded">/start</code></li>
                  <li>Klik link registrasi yang dikirimkan</li>
                  <li>Isi formulir pendaftaran</li>
                  <li>Simpan kode login yang diberikan</li>
                </ol>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
