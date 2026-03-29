'use client';

import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  PieChart, 
  Wallet,
  Truck,
  Store,
  Calculator,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, ZLICE_COMMISSION_RATE, GATEWAY_FEE_RATE } from '@/lib/financial-utils';
import type { SettlementBreakdown } from '@/types/analytics';

interface SettlementBreakdownCardProps {
  breakdown: SettlementBreakdown;
  loading?: boolean;
}

interface BreakdownItemProps {
  label: string;
  value: number;
  percentage?: number;
  icon: React.ReactNode;
  color: string;
  formula: string;
  description: string;
}

function BreakdownItem({ 
  label, 
  value, 
  percentage, 
  icon, 
  color, 
  formula, 
  description 
}: BreakdownItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-help group">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                {icon}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {label}
                </p>
                {percentage !== undefined && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {percentage.toFixed(1)}% of revenue
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-slate-900 dark:text-white">
                {formatCurrency(value)}
              </span>
              <HelpCircle className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs p-4">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
            <div className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 mt-2">
              <code className="text-xs font-mono text-slate-600 dark:text-slate-300">
                {formula}
              </code>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SettlementSkeleton() {
  return (
    <Card className="border shadow-sm animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const SettlementBreakdownCard = memo(({ breakdown, loading }: SettlementBreakdownCardProps) => {
  if (loading) {
    return <SettlementSkeleton />;
  }

  const totalRevenue = breakdown.totalRevenue || 1; // Avoid division by zero
  
  const items: BreakdownItemProps[] = [
    {
      label: 'Zlice Commission',
      value: breakdown.zliceCommission,
      percentage: (breakdown.zliceCommission / totalRevenue) * 100,
      icon: <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-100 dark:bg-indigo-900/30',
      formula: `total_amount × ${(ZLICE_COMMISSION_RATE * 100).toFixed(1)}%`,
      description: `Platform commission charged on Zlice App orders only (${breakdown.zliceOrderCount} orders)`,
    },
    {
      label: 'Kitchen Settlement',
      value: breakdown.canteenSettlement,
      percentage: (breakdown.canteenSettlement / totalRevenue) * 100,
      icon: <Store className="w-4 h-4 text-green-600 dark:text-green-400" />,
      color: 'bg-green-100 dark:bg-green-900/30',
      formula: 'base_subtotal + gst_canteen + packaging_amount',
      description: 'Total amount payable to kitchens: base item prices (before 5% markup), their GST share, and actual packaging costs',
    },
    {
      label: 'Delivery Partner',
      value: breakdown.deliveryPartnerAmount,
      percentage: (breakdown.deliveryPartnerAmount / totalRevenue) * 100,
      icon: <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      formula: 'Σ delivery_partner_amount',
      description: 'Actual amounts paid to delivery partners (before 2% markup charged to customers)',
    },
    {
      label: 'Gateway Fees',
      value: breakdown.totalRevenue * GATEWAY_FEE_RATE,
      percentage: GATEWAY_FEE_RATE * 100,
      icon: <Wallet className="w-4 h-4 text-red-600 dark:text-red-400" />,
      color: 'bg-red-100 dark:bg-red-900/30',
      formula: `total_amount × ${(GATEWAY_FEE_RATE * 100)}%`,
      description: 'Payment gateway processing fees (Razorpay/similar)',
    },
    {
      label: 'Platform Profit',
      value: breakdown.platformProfit,
      percentage: (breakdown.platformProfit / totalRevenue) * 100,
      icon: <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-100 dark:bg-emerald-900/30',
      formula: 'net_after_gateway - settlements - payouts',
      description: 'Net profit after all payouts (from Zlice orders only)',
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Settlement Breakdown
            </CardTitle>
            <CardDescription className="mt-1">
              Financial distribution for {breakdown.zliceOrderCount + breakdown.posOrderCount} orders
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Zlice: {breakdown.zliceOrderCount}
            </Badge>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
              PoS: {breakdown.posOrderCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Revenue Summary */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(breakdown.totalRevenue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Net After Gateway</p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {formatCurrency(breakdown.netAfterGateway)}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item, index) => (
            <BreakdownItem key={index} {...item} />
          ))}
        </div>

        {/* GST Breakdown */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            GST Split
          </p>
          <div className="grid grid-cols-3 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-help">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Collected</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(breakdown.gstTotal)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Total GST collected from customers (on inflated prices)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-help">
                    <p className="text-xs text-green-600 dark:text-green-400">To Kitchen</p>
                    <p className="font-semibold text-green-700 dark:text-green-300">
                      {formatCurrency(breakdown.gstCanteen)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">GST payable to kitchens (on base/non-inflated prices)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-help">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Retained</p>
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      {formatCurrency(breakdown.gstRetained)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">GST retained by platform (difference from price elevation)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SettlementBreakdownCard.displayName = 'SettlementBreakdownCard';

export default SettlementBreakdownCard;
