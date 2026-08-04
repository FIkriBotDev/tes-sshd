'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, TrendingUp, Shield, Zap } from 'lucide-react';
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
      {/* Left - Branding */}
      <div className="lg:w-1/2 gradient-primary flex flex-col justify-center p-8 lg:p-16 text-white">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
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

      {/* Right - Login */}
      <div className="lg:w-1/2 flex flex-col justify-center p-8 lg:p-16">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-md mx-auto w-full"
        >
          <h2 className="text-3xl font-bold mb-2">Selamat Datang 👋</h2>
          <p className="text-muted-foreground mb-8">Login menggunakan Telegram untuk mulai menggunakan TemanDuit</p>

          <div className="space-y-4">
            <a href={BOT_URL} target="_blank" rel="noopener noreferrer">
              <button className="w-full flex items-center justify-center gap-3 bg-[#229ED9] hover:bg-[#1a8bbf] text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
                Login dengan Telegram
              </button>
            </a>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
                  Daftar via Telegram Bot
                </a>
              </p>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Cara login:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Buka Telegram Bot <strong>@TemanDuitBot</strong></li>
                <li>Ketik <code className="bg-muted px-1 rounded">/start</code></li>
                <li>Klik link registrasi yang dikirimkan</li>
                <li>Lengkapi formulir pendaftaran</li>
                <li>Kembali ke sini dan refresh halaman</li>
              </ol>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
