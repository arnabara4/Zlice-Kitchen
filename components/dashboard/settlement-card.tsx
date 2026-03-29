"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, IndianRupee, Clock, CheckCircle2, CalendarDays } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WalletStats {
  netBalance: number;
  pending: number;
  matured: number;
  settlingToday: number;
  settlingTodayBreakdown?: { date: string; amount: number }[];
}

interface SettlementWalletProps {
  wallet: WalletStats;
}

export const SettlementWalletCard = memo(({ wallet }: SettlementWalletProps) => {
  return (
    <Card className="border border-emerald-100 dark:border-emerald-900 shadow-sm bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20">
      <CardHeader className="pb-2 border-b border-emerald-100 dark:border-emerald-900/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-emerald-400 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              Settlement Wallet
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your live financial overview
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-slate-400 hover:text-emerald-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3 text-xs bg-slate-900 text-slate-50 border-slate-800">
                <p className="font-semibold mb-1">T+2 Working Day Settlement</p>
                <p>Orders take 2 working days (excluding weekends) to settle.</p>
                <ul className="list-disc pl-3 mt-1 space-y-1 text-[10px] text-slate-300">
                  <li><strong>Pending:</strong> Orders waiting for T+2 maturity.</li>
                  <li><strong>Matured:</strong> Funds ready for payout.</li>
                  <li><strong>Settling Today:</strong> Orders maturing exactly today.</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Unpaid Balance */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            Total Unpaid
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                   <Info className="h-3 w-3 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-800 text-xs">
                  Lifetime Earnings - Total Paid
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{wallet.netBalance.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Total Pending + Matured</p>
        </div>

        {/* Matured (Available) */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Matured
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ₹{wallet.matured.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/50">Ready for payout</p>
        </div>

        {/* Pending (Locked) */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-amber-700 dark:text-amber-400">
              ₹{wallet.pending.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-500/50">Settling in 1-2 days</p>
        </div>

        {/* Settling Today - Highlighted */}
        <div className={`space-y-1 -m-2 p-2 rounded-lg border flex flex-col justify-center ${
            wallet.settlingToday > 0 ? "bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" : "bg-slate-50 dark:bg-slate-900 border-transparent dark:border-transparent"
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              wallet.settlingToday > 0 ? "text-blue-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
          }`}>
             <CalendarDays className="h-3.5 w-3.5" />
             Settling Today
          </p>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold ${
                wallet.settlingToday > 0 ? "text-blue-800 dark:text-blue-300" : "text-slate-700 dark:text-slate-500"
            }`}>
              ₹{wallet.settlingToday.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            {wallet.settlingTodayBreakdown && wallet.settlingTodayBreakdown.length > 0 ? (
               <div className="flex flex-wrap gap-x-2">
                 {wallet.settlingTodayBreakdown.map((item, i) => (
                    <span key={i} className="font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                       {item.date}: ₹{item.amount.toLocaleString()}
                    </span>
                 ))}
               </div>
            ) : (
               "No orders maturing today"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

SettlementWalletCard.displayName = "SettlementWalletCard";
