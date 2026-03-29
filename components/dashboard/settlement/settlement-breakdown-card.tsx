"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/financial-utils";
import { CalendarDays, ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";

interface SettlementBreakdownCardProps {
  date: Date;
  stats: {
    totalOrders: number;
    grossAmount: number;
    alreadyPaid: number;
    /** SUM(canteen_amount) WHERE is_settled = false for this day */
    pendingAmount: number;
  };
  isLoading?: boolean;
  onViewDetails?: () => void;
}

export function SettlementBreakdownCard({ date, stats, isLoading, onViewDetails }: SettlementBreakdownCardProps) {
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  if (isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900 animate-pulse h-40">
        <CardContent className="p-6">
          <div className="h-6 w-48 bg-slate-800 rounded mb-4" />
          <div className="grid grid-cols-4 gap-4">
            <div className="h-12 bg-slate-800 rounded" />
            <div className="h-12 bg-slate-800 rounded" />
            <div className="h-12 bg-slate-800 rounded" />
            <div className="h-12 bg-slate-800 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-800 bg-slate-900 overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Settlement for {formattedDate}
          </CardTitle>
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              View Breakdown
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">

        {/* Total Orders */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase">Orders</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>

        {/* Gross Sales */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase">Gross Sales</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.grossAmount)}</p>
        </div>

        {/* Settled */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-blue-400 uppercase flex items-center gap-1">
            Received <ArrowDownLeft className="h-3 w-3" />
          </p>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.alreadyPaid)}</p>
        </div>

        {/* Unsettled */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-400 uppercase flex items-center gap-1">
            Pending <ArrowUpRight className="h-3 w-3" />
          </p>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(stats.pendingAmount)}</p>
        </div>

      </CardContent>
    </Card>
  );
}
