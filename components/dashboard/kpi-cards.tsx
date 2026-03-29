"use client";

import { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IndianRupee, 
  ShoppingCart, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface GrowthIndicatorProps {
  current: number;
  previous: number;
  showBadge?: boolean;
}

const GrowthIndicator = memo(({ current, previous, showBadge = false }: GrowthIndicatorProps) => {
  const growth = useMemo(() => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, [current, previous]);

  const isPositive = growth >= 0;
  const isSignificant = Math.abs(growth) > 10;

  if (showBadge) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-[10px] font-medium px-1.5 py-0 h-5",
          isPositive 
            ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-900/20" 
            : "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900/20"
        )}
      >
        {isPositive ? (
          <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
        ) : (
          <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />
        )}
        {Math.abs(growth).toFixed(0)}%
      </Badge>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-0.5 text-xs font-medium",
      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
    )}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span>{Math.abs(growth).toFixed(1)}%</span>
      {isSignificant && isPositive && (
        <Sparkles className="h-2.5 w-2.5 ml-0.5 text-amber-500" />
      )}
    </div>
  );
});

GrowthIndicator.displayName = "GrowthIndicator";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
}

// Optimized AnimatedNumber with value change detection
const AnimatedNumber = memo(({ value, prefix = '', suffix = '' }: AnimatedNumberProps) => {
  return <>{prefix}{value.toLocaleString('en-IN')}{suffix}</>;
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && 
         prevProps.prefix === nextProps.prefix && 
         prevProps.suffix === nextProps.suffix;
});

AnimatedNumber.displayName = "AnimatedNumber";

interface KPICardProps {
  title: string;
  value: number;
  previousValue: number;
  icon: 'revenue' | 'orders' | 'avg' | 'khata' | 'users';
  prefix?: string;
  isInteger?: boolean;
  subtitle?: string;
  href?: string;
}

export const KPICard = memo(({ 
  title, 
  value, 
  previousValue, 
  icon, 
  prefix = '', 
  isInteger = false,
  subtitle,
  href
}: KPICardProps) => {
  const icons = {
    revenue: IndianRupee,
    orders: ShoppingCart,
    avg: TrendingUp,
    khata: Wallet,
    users: Users
  };

  const Icon = icons[icon];
  
  // Premium Icon Colors
  const iconColors = {
    revenue: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    orders: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    avg: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    khata: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    users: "text-pink-400 bg-pink-500/10 border-pink-500/20"
  };

  const Content = (
    <>
      <div className="flex justify-between items-start mb-2">
        <div className={cn("p-2 rounded-lg border", iconColors[icon])}>
          <Icon className="h-4 w-4" />
        </div>
        {previousValue !== undefined && (
          <GrowthIndicator current={value} previous={previousValue} />
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
        <div className="flex items-baseline gap-1">
           <span className="text-lg font-bold text-slate-100 tracking-tight">
             <AnimatedNumber value={value} prefix={prefix} />
           </span>
           {subtitle && <span className="text-[10px] text-slate-500">/ {subtitle}</span>}
        </div>
      </div>
    </>
  );

  const cardClasses = "bg-[#1e1b2e] border-white/5 shadow-lg hover:border-white/10 transition-all duration-300 h-full flex flex-col justify-between p-4 rounded-xl relative overflow-hidden group";

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card className={cn(cardClasses, "hover:bg-[#25213b]")}>
           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           {Content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cardClasses}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {Content}
    </Card>
  );
});

KPICard.displayName = "KPICard";

// Enhanced stat card for inline use
interface StatBadgeProps {
  label: string;
  value: number;
  prefix?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const StatBadge = memo(({ label, value, prefix = '₹', variant = 'default' }: StatBadgeProps) => {
  const variantClasses = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      variantClasses[variant]
    )}>
      <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
      <span className="font-bold">{prefix}{value.toLocaleString('en-IN')}</span>
    </div>
  );
});

StatBadge.displayName = "StatBadge";

export { AnimatedNumber, GrowthIndicator };
