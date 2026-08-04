'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { searchApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { SearchResult } from '@/lib/api';

interface HeaderProps {
  onMenuToggle: () => void;
  notificationCount?: number;
}

export function Header({ onMenuToggle, notificationCount = 0 }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const res = await searchApi.search(q);
      setResults(res.data || []);
      setShowResults(true);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const getResultIcon = (type: string) => {
    const map: Record<string, string> = {
      transaction: '💸', debt: '📋', reminder: '⏰', category: '🏷️', insight: '💡',
    };
    return map[type] || '🔍';
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <Button variant="ghost" size="icon" onClick={onMenuToggle} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari transaksi, hutang, reminder..."
          className="pl-9 h-9"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />

        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full mt-1 w-full bg-popover border rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto"
            >
              {results.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent cursor-pointer"
                  onClick={() => { setShowResults(false); setQuery(''); }}
                >
                  <span>{getResultIcon(r.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                  </div>
                  {r.amount && <span className="text-xs font-medium text-muted-foreground">{formatCurrency(r.amount)}</span>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Balance display */}
        {user && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
            <span className="text-xs font-medium">Saldo:</span>
            <span className="text-sm font-bold">{formatCurrency(user.balance)}</span>
          </div>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" onClick={() => router.push('/notifications')}>
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
