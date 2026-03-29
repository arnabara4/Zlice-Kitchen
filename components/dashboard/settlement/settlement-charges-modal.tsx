"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSettlementDetails } from "@/hooks/use-dashboard-fetch";
import { useCanteen } from "@/lib/canteen-context";
import { SettlementChargesTable } from "./settlement-charges-table";

interface SettlementChargesModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  data: any | null;
  loading?: boolean;
}

export function SettlementChargesModal({ isOpen, onClose, date, data: initialData, loading: initialLoading }: SettlementChargesModalProps) {
  const [localDate, setLocalDate] = useState<Date>(date);
  const { selectedCanteenId } = useCanteen();

  // Reset local date when modal opens with new global date
  useEffect(() => {
    if (isOpen) {
      setLocalDate(date);
    }
  }, [isOpen, date]);

  // Fetch data if localDate is different from the global date, otherwise use initialData
  const isSameDate = localDate.getTime() === date.getTime();
  const { data: fetchedData, loading: fetchedLoading } = useSettlementDetails(
    selectedCanteenId ?? undefined,
    localDate,
    { enabled: isOpen && !isSameDate }
  );

  const currentData = isSameDate ? initialData : fetchedData;
  const currentLoading = isSameDate ? initialLoading : fetchedLoading;

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  // Calculate total charges for the day from the selected orders
  const totalChargesToday = currentData?.orders?.reduce((sum: number, order: any) => sum + (Number(order.charges) || 0), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col bg-slate-950/95 backdrop-blur-2xl border-red-500/10 text-white p-0 gap-0 shadow-2xl shadow-black/80"
      >
        <DialogHeader className="p-4 md:p-6 border-b border-white/5 flex flex-row items-center justify-between shrink-0 space-y-0 bg-white/[0.02]">
          <div className="space-y-1 min-w-0">
            <DialogTitle className="text-lg md:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2 md:gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600">
                Extra Charges Details
              </span>
              <span className="text-[10px] md:text-sm font-medium text-slate-400 font-mono tracking-wide uppercase px-1.5 md:px-2 py-0.5 rounded-full bg-slate-900 border border-white/5">
                {format(localDate, "MMM yyyy")}
              </span>
            </DialogTitle>
            <p className="text-xs md:text-sm text-slate-500 font-medium tracking-wide">
              Detailed breakdown of extra charges for{" "}
              <span className="text-slate-300">{format(localDate, "MMMM d, yyyy")}</span>{" "}
              <span className="text-slate-600">(IST)</span>
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-slate-800 hover:text-white text-slate-400 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 to-slate-950/50">
          <div className="px-3 md:px-8 py-3 md:py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
             <h3 className="text-xs md:text-sm font-medium text-slate-300">Transaction History</h3>
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white h-8 md:h-9 text-xs md:text-sm",
                      !localDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {localDate ? format(localDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
                  <Calendar
                    mode="single"
                    selected={localDate}
                    onSelect={(d) => d && setLocalDate(d)}
                    initialFocus
                    className="bg-slate-900 text-white"
                  />
                </PopoverContent>
              </Popover>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4 md:p-8">
            <SettlementChargesTable orders={currentData?.orders || []} isLoading={currentLoading ?? false} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
