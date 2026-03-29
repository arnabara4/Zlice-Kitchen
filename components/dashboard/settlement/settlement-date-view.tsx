"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SettlementBreakdownCard } from "./settlement-breakdown-card";
import { SettlementDetailTable } from "./settlement-detail-table";
import { useSettlementDetails } from "@/hooks/use-dashboard-fetch";
import { cn } from "@/lib/utils";

interface SettlementDateViewProps {
  canteenId: string | undefined;
}

export function SettlementDateView({ canteenId }: SettlementDateViewProps) {
  // Default to today
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    // Adjust to Indian Timezone logic if needed, but client side 'new Date()' is usually local.
    // For simplicity, we use local client date.
    return d;
  });

  const { data, loading } = useSettlementDetails(canteenId, date);

  // Quick date navigation
  const handlePrevDay = () => {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    setDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    setDate(next);
  };

  const handleToday = () => {
    setDate(new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">Settlement Details</h3>
        
        {/* Date Controls */}
        <div className="flex items-center gap-2">
           <div className="flex items-center rounded-md border border-slate-800 bg-slate-900 p-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={handlePrevDay}
              >
                 <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-3 text-sm font-medium hover:bg-slate-800 hover:text-white w-[140px]",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {date ? format(date, "EEE, dd MMM") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={handleNextDay}
              >
                 <ChevronRight className="h-4 w-4" />
              </Button>
           </div>
           
           <Button variant="outline" size="sm" onClick={handleToday} className="h-9 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white">
             Today
           </Button>
        </div>
      </div>

      {/* Breakdown Card */}
      <SettlementBreakdownCard 
        date={date} 
        stats={data?.breakdown ? {
           totalOrders:  data.breakdown.totalOrders,
           grossAmount:  data.breakdown.grossAmount,
           alreadyPaid:  data.breakdown.alreadyPaid,
           pendingAmount: data.breakdown.pendingAmount,
        } : {
           totalOrders:   0,
           grossAmount:   0,
           alreadyPaid:   0,
           pendingAmount: 0,
        }}
        isLoading={loading}
      />

      {/* Detailed Table */}
      <SettlementDetailTable 
        orders={data?.orders || []} 
        isLoading={loading}
      />
    </div>
  );
}
