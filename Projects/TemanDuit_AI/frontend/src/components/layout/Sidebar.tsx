'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ArrowUpDown, TrendingUp, PieChart, CreditCard,
  Bell, BarChart3, Sparkles, BellRing, Settings, User, Wallet,
  X, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: ArrowUpDown },
  { href: '/income', label: 'Pemasukan', icon: TrendingUp },
  { href: '/budget', label: 'Budget', icon: PieChart },
  { href: '/debt', label: 'Hutang', icon: CreditCard },
  { href: '/reminder', label: 'Reminder', icon: Bell },
  { href: '/saving', label: 'Tabungan', icon: Wallet },
  { href: '/analytics', label: 'Analitik', icon: BarChart3 },
  { href: '/ai-insight', label: 'AI Insight', icon: Sparkles },
  { href: '/notifications', label: 'Notifikasi', icon: BellRing },
];

const bottomItems = [
  { href: '/settings', label: 'Pengaturan', icon: Settings },
  { href: '/profile', label: 'Profil', icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === href;
    return (
      <Link href={href} onClick={onClose}>
        <motion.div
          whileHover={{ x: 4 }}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
            active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
          <span>{label}</span>
          {active && <ChevronRight className="ml-auto h-3 w-3 text-primary-foreground/70" />}
        </motion.div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-card flex flex-col',
          'lg:relative lg:z-auto lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-300 ease-in-out',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <div>
              <p className="font-bold text-sm">TemanDuit</p>
              <p className="text-xs text-muted-foreground">Finance AI</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-accent rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.occupation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom nav */}
        <div className="border-t px-3 py-3 space-y-1">
          {bottomItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </motion.aside>
    </>
  );
}
