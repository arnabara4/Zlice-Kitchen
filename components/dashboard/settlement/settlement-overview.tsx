"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, CheckCircle2, Clock, Info, Calendar as CalendarIcon, ArrowUpRight, WalletCards } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/financial-utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { WithdrawalHistory } from "./withdrawal-history";
import { WalletStats } from "@/types/analytics";
import { useCanteen } from "@/lib/canteen-context";
import { toast } from "sonner";
import { ViewChargesModal } from "./view-charges-modal";

interface SettlementOverviewProps {
  stats: {
    totalRevenue: number;
    platformFees: number;
    netPayable: number;
    alreadySettled: number;
    remainingPayable: number;
  };
  walletStats: WalletStats;
  isLoading?: boolean;
}

export function SettlementOverview({ stats, walletStats, isLoading }: SettlementOverviewProps) {
  const [isViewChargesOpen, setIsViewChargesOpen] = useState(false);
  const [isWithdrawalsOpen, setIsWithdrawalsOpen] = useState(false);
  const { selectedCanteen, selectedCanteenId } = useCanteen();

  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawal = async () => {
    if (isWithdrawing) return;
    
    if (stats.remainingPayable <= 0) {
      toast.error("No pending settlement due to withdraw.");
      return;
    }
    
    setIsWithdrawing(true);
    try {
      const response = await fetch("/api/canteen/withdrawals", {
        method: "POST",
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to create withdrawal request");
      }
      
      toast.success(data.message || "Withdrawal request created successfully!");

      const amount = stats.remainingPayable;
      const canteenName = selectedCanteen?.name || "Kitchen";
      const message = `New Withdrawal Request\nCanteen: ${canteenName}\nAmount: ${formatCurrency(amount)}\nStatus: Pending`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/8278637608?text=${encodedMessage}`, "_blank");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Pie chart data for desktop
  const chartData = useMemo(() => {
    return [
      { name: "Settled", value: Math.max(0, stats.alreadySettled), color: "#10b981" },
      { name: "Due", value: Math.max(0, stats.remainingPayable), color: "#f59e0b" },
      { name: "Charges", value: Math.max(0, stats.platformFees), color: "#ef4444" },
    ].filter(item => item.value > 0);
  }, [stats]);

  const chartTotal = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = chartTotal > 0 ? ((value / chartTotal) * 100).toFixed(0) : '0';
    return (
      <text x={x} y={y} fill="#e2e8f0" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight={600}>
        {name} {pct}%
      </text>
    );
  };

  console.log(walletStats)

  if (isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900 animate-pulse h-64 mb-6">
        <CardContent className="p-6">
          <div className="h-6 w-48 bg-slate-800 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="grid grid-cols-2 gap-4">
               <div className="h-16 bg-slate-800 rounded"></div>
               <div className="h-16 bg-slate-800 rounded"></div>
               <div className="h-16 bg-slate-800 rounded"></div>
               <div className="h-16 bg-slate-800 rounded"></div>
             </div>
             <div className="h-40 bg-slate-800 rounded-full w-40 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 mb-4">
      <Card className="border border-white/10 shadow-2xl bg-[#0f111a] overflow-hidden relative group">
        <CardContent className="p-4 sm:p-6 relative z-10">
          
          {/* ========== DESKTOP LAYOUT ========== */}
          <div className="hidden md:block">
            <div className="grid grid-cols-5 gap-6">
              {/* LEFT: Stats Cards (3 cols) */}
              <div className="col-span-3 flex flex-col gap-4">
                
                {/* Due + Settled Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Due */}
                  <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/30 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Total</p>
                      <p className="text-[10px] text-indigo-400/60">Zlice Orders only</p>
                    </div>
                    <div className="text-3xl font-black text-indigo-50 tracking-tight mt-3">
                      {formatCurrency(walletStats.lifetimeNet || 0)}
                    </div>
                  </div>

                  {/* Settled */}
                  <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Settled</p>
                        <p className="text-[10px] text-emerald-500/60">Paid to you</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500/40" />
                    </div>
                    <div className="text-3xl font-black text-emerald-50 tracking-tight mt-3 mb-3">
                      {formatCurrency(stats.alreadySettled)}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setIsWithdrawalsOpen(true)}
                      className="h-8 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/20"
                    >
                      History
                    </Button>
                  </div>
                </div>

                {/* Charges + Settlement Total Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Charges */}
                  <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/30 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-0.5">Charges</p>
                      <p className="text-[10px] text-red-500/60">Deductions applied</p>
                    </div>
                    <div className="text-3xl font-black text-red-50 tracking-tight mt-3 mb-3">
                      {formatCurrency(stats.platformFees)}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setIsViewChargesOpen(true)}
                      className="h-8 w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-500/20"
                    >
                      View Details
                    </Button>
                  </div>

                  {/* Total */}
                  <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-0.5">Due</p>
                      <p className="text-[10px] text-amber-500/60">Pending settlement</p>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tight mt-3 mb-3">
                      {formatCurrency(stats.remainingPayable)}
                    </div>
                    <Button 
                      size="sm" 
                      className="h-8 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-500/20"
                      onClick={handleWithdrawal}
                      disabled={isWithdrawing || stats.remainingPayable <= 0}
                    >
                      {isWithdrawing ? "Processing..." : "Withdraw"}
                    </Button>
                  </div>
                  
                </div>
              </div>

              {/* RIGHT: Pie Chart (2 cols) */}
              <div className="col-span-2 flex flex-col">
                <div className="relative bg-slate-900/50 rounded-2xl border border-white/5 p-4 flex-1 flex flex-col shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Breakdown</p>
                  </div>
                  
                  <div className="flex-1 flex justify-center items-center min-h-[240px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            label={renderCustomLabel}
                            labelLine={false}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number, name: string) => {
                              const pct = chartTotal > 0 ? ((value / chartTotal) * 100).toFixed(1) : '0';
                              return [`${formatCurrency(value)} (${pct}%)`, name];
                            }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                            itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={30} 
                            iconType="circle"
                            wrapperStyle={{ fontSize: '10px', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', color: '#94a3b8' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-500 flex flex-col items-center">
                        <Wallet className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-xs">No data yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== MOBILE LAYOUT (Row-wise stacked) ========== */}
          <div className="md:hidden flex flex-col gap-3">

            {/* Due */}
            <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/30 flex items-center justify-between shadow-lg shadow-indigo-500/5">
              <div>
                <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-[10px] text-indigo-400/60 font-medium">Zlice Orders only</p>
              </div>
              <div className="text-2xl font-black text-indigo-50 tracking-tighter">
                {formatCurrency(walletStats.lifetimeNet || 0)}
              </div>
            </div>
            {/* Settled */}
            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-lg shadow-emerald-500/5">
              <div>
                <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-1">Settled</p>
                <Button 
                  size="sm" 
                  onClick={() => setIsWithdrawalsOpen(true)}
                  className="h-7 px-4 mt-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] rounded-lg shadow-lg shadow-emerald-500/20"
                >
                  History
                </Button>
              </div>
              <div className="text-2xl font-black text-emerald-50 tracking-tighter">
                {formatCurrency(stats.alreadySettled)}
              </div>
            </div>

            {/* Charges */}
            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/30 flex items-center justify-between shadow-lg shadow-red-500/5">
              <div>
                <p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-1">Charges</p>
                <Button 
                  size="sm" 
                  onClick={() => setIsViewChargesOpen(true)}
                  className="h-7 px-4 mt-1 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] rounded-lg shadow-lg shadow-red-500/20"
                >
                  View Details
                </Button>
              </div>
              <div className="text-2xl font-black text-red-50 tracking-tighter">
                {formatCurrency(stats.platformFees)}
              </div>
            </div>

            {/* Total */}
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-lg shadow-amber-500/5">
              <div>
                <p className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-1">Due</p>
                <Button 
                  size="sm" 
                  className="h-8 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-lg shadow-amber-500/20 mt-1"
                  onClick={handleWithdrawal}
                  disabled={isWithdrawing || stats.remainingPayable <= 0}
                >
                  {isWithdrawing ? "..." : "Withdraw"}
                </Button>
              </div>
              <div className="text-2xl font-black text-white tracking-tighter">
                {formatCurrency(stats.remainingPayable)}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Withdrawals Modal */}
      <Dialog open={isWithdrawalsOpen} onOpenChange={setIsWithdrawalsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-950 border-slate-800 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Withdrawal History
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              All your withdrawal requests and their payment status.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <WithdrawalHistory />
          </div>
        </DialogContent>
      </Dialog>

      <ViewChargesModal 
        isOpen={isViewChargesOpen}
        onClose={() => setIsViewChargesOpen(false)}
      />
    </div>
  );
}
