'use client';
import { useEffect, useState } from 'react';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationApi, type Notification } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  budget_warning: { icon: '⚠️', color: 'border-l-yellow-500' },
  budget_exceeded: { icon: '🚨', color: 'border-l-red-500' },
  reminder_due: { icon: '⏰', color: 'border-l-blue-500' },
  new_insight: { icon: '💡', color: 'border-l-purple-500' },
  large_expense: { icon: '💸', color: 'border-l-orange-500' },
  saving_goal_reached: { icon: '🎉', color: 'border-l-emerald-500' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <AppLayout><PageLoading /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title="Notifikasi"
        description={unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-2" />Tandai Semua Dibaca
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-muted-foreground" />}
          title="Tidak Ada Notifikasi"
          description="Notifikasi tentang budget, reminder, dan insight akan muncul di sini"
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || { icon: '🔔', color: 'border-l-gray-400' };
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Card
                    className={cn(
                      'border-l-4 transition-all hover:shadow-sm cursor-pointer',
                      config.color,
                      !n.isRead && 'bg-accent/30',
                    )}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('font-medium', !n.isRead && 'text-foreground')}>{n.title}</p>
                            <div className="flex items-center gap-1">
                              {!n.isRead && <Badge variant="default" className="h-4 text-[10px]">Baru</Badge>}
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1.5">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </AppLayout>
  );
}
