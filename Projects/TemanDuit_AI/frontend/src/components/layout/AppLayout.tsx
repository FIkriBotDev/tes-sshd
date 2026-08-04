'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRequireAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/lib/api';

interface AppLayoutProps { children: React.ReactNode; }

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const { isAuthenticated } = useRequireAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCount = async () => {
      try {
        const res = await notificationApi.getCount();
        setNotifCount(res.data?.count || 0);
      } catch { /* silent */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} notificationCount={notifCount} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
