import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TemanDuit - AI Personal Finance Assistant',
  description: 'Asisten keuangan pribadi berbasis AI. Catat pengeluaran, analisis keuangan, dan capai target finansialmu.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          {children}
          <Toaster richColors position="top-right" expand={false} />
        </ThemeProvider>
      </body>
    </html>
  );
}
