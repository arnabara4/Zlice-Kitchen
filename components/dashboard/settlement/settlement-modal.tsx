"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SettlementDetailTable } from "./settlement-detail-table";

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Controlled from parent — same date the daily breakdown card shows */
  date: Date;
  /** Pre-fetched data passed from parent (React Query cache hit, no extra call) */
  data: any | null;
  loading?: boolean;
}

export function SettlementModal({ isOpen, onClose, date, data, loading }: SettlementModalProps) {
  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col bg-slate-950/95 backdrop-blur-2xl border-amber-500/10 text-white p-0 gap-0 shadow-2xl shadow-black/80"
      >
        <DialogHeader className="p-4 md:p-6 border-b border-white/5 flex flex-row items-center justify-between shrink-0 space-y-0 bg-white/[0.02]">
          <div className="space-y-1 min-w-0">
            <DialogTitle className="text-lg md:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2 md:gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Settlement Details
              </span>
              <span className="text-[10px] md:text-sm font-medium text-slate-400 font-mono tracking-wide uppercase px-1.5 md:px-2 py-0.5 rounded-full bg-slate-900 border border-white/5">
                {format(date, "MMM yyyy")}
              </span>
            </DialogTitle>
            <p className="text-xs md:text-sm text-slate-500 font-medium tracking-wide">
              Financial breakdown for{" "}
              <span className="text-slate-300">{format(date, "MMMM d, yyyy")}</span>{" "}
              <span className="text-slate-600">(IST)</span>
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gradient-to-b from-slate-950 to-slate-950/50">
          {/* 4 summary KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">

            {/* Gross Sales */}
            <div className="group relative p-3 md:p-6 rounded-xl md:rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1.5">
                Gross Sales
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              </p>
              <p className="text-lg md:text-3xl font-bold text-white tracking-tight relative z-10">
                {formatINR(data?.breakdown?.grossAmount || 0)}
              </p>
              <p className="text-[9px] md:text-xs text-slate-600 mt-1 hidden md:block">total_amount for the day</p>
            </div>

            {/* Net Settled */}
            <div className="group relative p-3 md:p-6 rounded-xl md:rounded-2xl bg-slate-900/40 border border-white/5 hover:border-emerald-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[10px] md:text-xs font-semibold text-emerald-500/80 uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1.5">
                Net Settled
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </p>
              <p className="text-lg md:text-3xl font-bold text-emerald-400 tracking-tight relative z-10 drop-shadow-sm">
                {formatINR(data?.breakdown?.alreadyPaid || 0)}
              </p>
              <p className="text-[9px] md:text-xs text-slate-600 mt-1 hidden md:block">canteen_amount (is_settled = true)</p>
            </div>

            {/* Charges */}
            <div className="group relative p-3 md:p-6 rounded-xl md:rounded-2xl bg-slate-900/40 border border-white/5 hover:border-red-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[10px] md:text-xs font-semibold text-red-500/80 uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1.5">
                Extra Charges
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </p>
              <p className="text-lg md:text-3xl font-bold text-red-500 tracking-tight relative z-10 drop-shadow-sm">
                {formatINR(data?.breakdown?.totalCharges || 0)}
              </p>
              <p className="text-[9px] md:text-xs text-slate-600 mt-1 hidden md:block">Sum of extra charges</p>
            </div>

            {/* Pending */}
            <div className="group relative p-3 md:p-6 rounded-xl md:rounded-2xl bg-slate-900/40 border border-white/5 hover:border-amber-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[10px] md:text-xs font-semibold text-amber-500/80 uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1.5">
                Pending
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </p>
              <p className="text-lg md:text-3xl font-bold text-amber-400 tracking-tight relative z-10 drop-shadow-sm">
                {formatINR(data?.breakdown?.pendingAmount || 0)}
              </p>
              <p className="text-[9px] md:text-xs text-slate-600 mt-1 hidden md:block">canteen_amount (is_settled = false)</p>
            </div>

          </div>

          <SettlementDetailTable orders={data?.orders || []} isLoading={loading ?? false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
