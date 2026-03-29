"use client";

import { memo, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Wallet,
  BadgeCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettlementStatusProps {
  totalEarned: number;
  totalPaid: number;
  totalDue: number;
  className?: string;
  showDetailedView?: boolean;
  onViewDetails?: () => void;
}

// Settlement status thresholds
const getSettlementStatus = (percentage: number) => {
  if (percentage >= 100) return { 
    status: 'fully-settled', 
    label: 'Fully Settled', 
    color: 'emerald',
    icon: CheckCircle2,
    description: 'All payments have been settled'
  };
  if (percentage >= 75) return { 
    status: 'mostly-settled', 
    label: 'Mostly Settled', 
    color: 'blue',
    icon: TrendingUp,
    description: 'Most payments are settled'
  };
  if (percentage >= 50) return { 
    status: 'partial', 
    label: 'Partially Settled', 
    color: 'amber',
    icon: Clock,
    description: 'Settlement in progress'
  };
  if (percentage > 0) return { 
    status: 'pending', 
    label: 'Pending Settlement', 
    color: 'orange',
    icon: AlertCircle,
    description: 'Awaiting settlement'
  };
  return { 
    status: 'no-earnings', 
    label: 'No Earnings', 
    color: 'slate',
    icon: Wallet,
    description: 'Start receiving online orders'
  };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const SettlementStatusBadge = memo(({ percentage }: { percentage: number }) => {
  const { label, color } = getSettlementStatus(percentage);
  
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium text-xs", colorClasses[color])}
    >
      {label}
    </Badge>
  );
});

SettlementStatusBadge.displayName = "SettlementStatusBadge";

export const SettlementProgress = memo(({ 
  totalEarned, 
  totalPaid, 
  showLabels = true,
  size = 'default'
}: { 
  totalEarned: number; 
  totalPaid: number;
  showLabels?: boolean;
  size?: 'sm' | 'default' | 'lg';
}) => {
  const percentage = totalEarned > 0 ? Math.min((totalPaid / totalEarned) * 100, 100) : 0;
  const { color } = getSettlementStatus(percentage);

  const heightClasses = {
    sm: 'h-1.5',
    default: 'h-2.5',
    lg: 'h-4'
  };

  const progressColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    slate: 'bg-slate-400',
  };

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500 dark:text-slate-400">Settlement Progress</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden", heightClasses[size])}>
        <div 
          className={cn("h-full rounded-full transition-all duration-500 ease-out", progressColors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

SettlementProgress.displayName = "SettlementProgress";

export const SettlementStatusCard = memo(({ 
  totalEarned, 
  totalPaid, 
  totalDue,
  className,
  showDetailedView = false,
  onViewDetails
}: SettlementStatusProps) => {
  const percentage = totalEarned > 0 ? Math.min((totalPaid / totalEarned) * 100, 100) : 0;
  const { status, label, color, icon: StatusIcon, description } = getSettlementStatus(percentage);

  const cardBgClasses: Record<string, string> = {
    emerald: 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900',
    blue: 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900',
    amber: 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900',
    orange: 'border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-900',
    slate: 'border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/30 dark:to-slate-900',
  };

  const iconBgClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
    slate: 'bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400',
  };

  return (
    <Card className={cn("shadow-sm", cardBgClasses[color], className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl", iconBgClasses[color])}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          {status === 'fully-settled' && (
            <BadgeCheck className="h-6 w-6 text-emerald-500" />
          )}
        </div>

        {/* Progress Bar */}
        <SettlementProgress totalEarned={totalEarned} totalPaid={totalPaid} size="lg" />

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium mb-0.5">Total Earned</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalEarned)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">Settled</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-orange-600 dark:text-orange-400 font-medium mb-0.5">Pending</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalDue)}</p>
          </div>
        </div>

        {/* Action Button */}
        {showDetailedView && onViewDetails && (
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-sm font-medium"
            onClick={onViewDetails}
          >
            View Settlement Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

SettlementStatusCard.displayName = "SettlementStatusCard";

// Compact inline version for dashboard cards
export const SettlementStatusInline = memo(({ 
  totalEarned, 
  totalPaid 
}: { 
  totalEarned: number; 
  totalPaid: number;
}) => {
  const percentage = totalEarned > 0 ? Math.min((totalPaid / totalEarned) * 100, 100) : 0;
  
  return (
    <div className="flex items-center gap-2">
      <SettlementProgress 
        totalEarned={totalEarned} 
        totalPaid={totalPaid} 
        showLabels={false}
        size="sm"
      />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {percentage.toFixed(0)}% settled
      </span>
    </div>
  );
});

SettlementStatusInline.displayName = "SettlementStatusInline";

export { getSettlementStatus };
