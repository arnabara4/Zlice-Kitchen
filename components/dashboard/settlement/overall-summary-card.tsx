"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, Wallet, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OverallSettlementCardProps {
  stats: {
    totalRevenue: number;
    platformFees: number; // Commission + Gateway + etc
    netPayable: number;
    alreadySettled: number;
    remainingPayable: number;
  };
  isLoading?: boolean;
}

export function OverallSettlementCard({ stats, isLoading }: OverallSettlementCardProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900 animate-pulse h-48">
        <CardContent className="p-6">
          <div className="h-4 w-32 bg-slate-800 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="h-10 bg-slate-800 rounded"></div>
             <div className="h-10 bg-slate-800 rounded"></div>
             <div className="h-10 bg-slate-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/5 shadow-2xl bg-[#1e1b2e] overflow-hidden relative group">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Wallet className="h-5 w-5 text-amber-400" />
              </div>
              Settlement Status
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1 ml-11">
              Live financial overview of your earnings
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Total Settlement Amount (Gold) */}
          <div className="relative group/item">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Total Value
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                     <div className="text-3xl font-bold text-white tracking-tight group-hover/item:text-amber-100 transition-colors">
                        {formatCurrency(stats.totalRevenue)}
                     </div>
                  </TooltipTrigger>
                  <TooltipContent>Total value of orders to be settled (Zlice Only)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-[11px] text-slate-500 font-medium">Total Settlement Value</p>
            </div>
          </div>

          {/* Already Settled (Green) */}
          <div className="relative group/item">
            <div className="absolute left-[-16px] top-2 bottom-2 w-[1px] bg-white/5 hidden md:block"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Settled
              </p>
              <div className="text-2xl font-bold text-white tracking-tight group-hover/item:text-emerald-50 transition-colors">
                 {formatCurrency(stats.alreadySettled)}
              </div>
               <p className="text-[11px] text-emerald-500/40 font-medium">Transferred via Bank</p>
            </div>
          </div>

          {/* Remaining Payable (Amber/Orange) */}
          <div className="relative group/item">
            <div className="absolute left-[-16px] top-2 bottom-2 w-[1px] bg-white/5 hidden md:block"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-orange-500/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                Unsettled Balance
              </p>
              <div className="text-2xl font-bold text-white tracking-tight group-hover/item:text-orange-50 transition-colors">
                 {formatCurrency(stats.remainingPayable)}
              </div>
               <p className="text-[11px] text-orange-500/40 font-medium">Canteen Amount</p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
