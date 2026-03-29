
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Search, Filter, AlertCircle, ShoppingBag, Info, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getISTDayStart, getISTDayEnd } from "@/lib/financial-utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { addDays, startOfMonth, endOfMonth } from "date-fns";

interface Charge {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
  orderNumber: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface ViewChargesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ViewChargesModal({ isOpen, onClose }: ViewChargesModalProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Default to current month
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    if (isOpen) {
      fetchCharges();
    }
  }, [isOpen, dateRange, page]);

  const fetchCharges = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/canteen/charges?page=${page}&limit=10`;
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append("from", getISTDayStart(dateRange.from).toISOString());
      }
      if (dateRange?.to) {
        params.append("to", getISTDayEnd(dateRange.to).toISOString());
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `&${queryString}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch charges");
      }
      
      setCharges(data.charges || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      console.error("Error fetching charges:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-950 border-white/5 text-white p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 md:p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600">
                  Deduction History
                </span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Detailed logs of all charges and platform deductions
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal border-white/10 bg-slate-900/50 hover:bg-slate-800 text-xs",
                      !dateRange && "text-slate-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-950 border-white/10" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    className="bg-slate-950 text-white"
                  />
                </PopoverContent>
              </Popover>
              {(dateRange?.from || dateRange?.to) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setDateRange(undefined);
                    setPage(1);
                  }}
                  className="h-8 px-2 text-slate-500 hover:text-white hover:bg-white/5 text-[10px]"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-0">
          <div className="max-h-[50vh] overflow-y-auto">
            {isLoading ? (
              <div className="p-20 text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest animate-pulse">Loading Logs...</p>
              </div>
            ) : error ? (
              <div className="p-10 text-center space-y-4">
                <div className="bg-red-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-400 text-sm">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchCharges} className="border-white/10 hover:bg-white/5">
                  Retry
                </Button>
              </div>
            ) : charges.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="bg-slate-900/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto border border-white/5">
                  <Info className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-slate-500 text-xs font-medium">No deductions found for this period</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/[0.03] sticky top-0 z-10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest px-4 md:px-6 h-12">Details</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest px-4 md:px-6 h-12 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge) => (
                    <TableRow key={charge.id} className="border-white/5 hover:bg-white/[0.02] transition-colors h-16">
                      <TableCell className="px-4 md:px-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] md:text-xs font-bold md:font-black text-white leading-tight break-all md:break-words">{charge.reason}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-bold">
                              {format(new Date(charge.createdAt), "dd MMM, hh:mm a")}
                            </span>
                            {charge.orderNumber && (
                              <div className="flex items-center gap-1 opacity-80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                <ShoppingBag className="w-2.5 h-2.5 text-blue-400" />
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">#{charge.orderNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 md:px-6 text-right">
                        <span className="text-sm md:text-base font-bold md:font-black text-red-400 tracking-tight">
                          -{formatCurrency(charge.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination Footer */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 md:px-6 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="h-7 w-7 p-0 border-white/10 bg-slate-900/50 hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-300" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="h-7 w-7 p-0 border-white/10 bg-slate-900/50 hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.03] flex justify-end">
          <Button onClick={onClose} size="sm" variant="ghost" className="h-9 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5">
            Close Panel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
