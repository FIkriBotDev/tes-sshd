'use client';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: 'green' | 'red' | 'blue' | 'purple' | 'orange';
  index?: number;
}

const colorMap = {
  green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', value: 'text-emerald-700 dark:text-emerald-300' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400', value: 'text-red-700 dark:text-red-300' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', value: 'text-blue-700 dark:text-blue-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', value: 'text-purple-700 dark:text-purple-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', value: 'text-orange-700 dark:text-orange-300' },
};

export function StatCard({ title, value, subtitle, icon, trend, color = 'green', index = 0 }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className={cn('text-2xl font-bold mt-1', colors.value)}>
                {formatCurrency(value)}
              </p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
              {trend !== undefined && (
                <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium',
                  trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-muted-foreground',
                )}>
                  {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  <span>{Math.abs(trend)}% vs bulan lalu</span>
                </div>
              )}
            </div>
            <div className={cn('p-2.5 rounded-xl', colors.bg)}>
              <div className={cn('h-5 w-5', colors.icon)}>{icon}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
