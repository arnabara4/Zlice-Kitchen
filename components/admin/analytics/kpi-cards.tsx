'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Store,
  Smartphone,
  Monitor
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/financial-utils';
import type { KPIStats } from '@/types/analytics';

interface KPICardsProps {
  stats: KPIStats;
  loading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  textColor: string;
  iconBg: string;
  tooltip?: string;
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient, 
  textColor, 
  iconBg,
  tooltip 
}: KPICardProps) {
  return (
    <Card 
      className={`${gradient} border shadow-sm hover:shadow-md transition-shadow`}
      title={tooltip}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor} opacity-80`}>
              {title}
            </p>
            <p className={`text-3xl font-bold ${textColor} mt-1`}>
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
            {subtitle && (
              <p className={`text-xs ${textColor} opacity-70 mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 ${iconBg} rounded-xl`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KPICardSkeleton() {
  return (
    <Card className="bg-slate-100 dark:bg-slate-800 border animate-pulse">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-14 w-14 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export const KPICards = memo(({ stats, loading }: KPICardsProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    );
  }

  const cards: KPICardProps[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: `Avg: ${formatCurrency(stats.averageOrderValue)}/order`,
      icon: <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />,
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      iconBg: 'bg-green-500/10',
      tooltip: 'Sum of total_amount for all orders in the selected period',
    },
    {
      title: 'Platform Profit',
      value: formatCurrency(stats.totalProfit),
      subtitle: `Margin: ${stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%`,
      icon: <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-500/10',
      tooltip: 'Net profit after gateway fees, canteen settlements, and delivery payouts (Zlice orders only)',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      subtitle: `Zlice: ${stats.zliceOrders} | PoS: ${stats.posOrders}`,
      icon: <ShoppingBag className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      gradient: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      textColor: 'text-purple-700 dark:text-purple-300',
      iconBg: 'bg-purple-500/10',
      tooltip: 'Total order count with Zlice App vs PoS breakdown',
    },
    {
      title: 'Active Canteens',
      value: `${stats.activeCanteens}/${stats.totalCanteens}`,
      subtitle: `${stats.totalCanteens > 0 ? ((stats.activeCanteens / stats.totalCanteens) * 100).toFixed(0) : 0}% active`,
      icon: <Store className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
      gradient: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
      textColor: 'text-orange-700 dark:text-orange-300',
      iconBg: 'bg-orange-500/10',
      tooltip: 'Canteens with at least one order in the selected period',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <KPICard key={index} {...card} />
      ))}
    </div>
  );
});

KPICards.displayName = 'KPICards';

export default KPICards;
