import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getISTDayStart, getISTDayEnd } from "@/lib/financial-utils";
import { CheckCircle2, Clock, AlertCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface Transaction {
  id: string;
  amount: number;
  requested_at: string;
  paid: boolean;
  paid_at: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export function WithdrawalHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and Filter state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        let url = `/api/canteen/withdrawals?page=${page}&limit=7`;
        
        if (dateRange?.from) {
          url += `&from=${getISTDayStart(dateRange.from).toISOString()}`;
        }
        if (dateRange?.to) {
          url += `&to=${getISTDayEnd(dateRange.to).toISOString()}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load withdrawal history");
        }
        
        setTransactions(data.transactions || []);
        setPagination(data.pagination || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, [page, dateRange]);

  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-900 animate-pulse h-64">
         <CardContent className="p-6 flex items-center justify-center h-full">
            <span className="text-slate-500">Loading history...</span>
         </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-800 bg-slate-900 h-64">
         <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <span className="text-red-400">{error}</span>
         </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-slate-800 bg-slate-900 border-dashed h-48">
         <CardContent className="p-6 flex items-center justify-center h-full flex-col text-slate-500">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p>No withdrawal requests yet.</p>
         </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <div className="flex justify-end items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-3 text-[10px] sm:text-xs font-medium border-white/10 bg-slate-900/50 hover:bg-slate-800 text-slate-300",
                !dateRange && "text-slate-500"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </>
                ) : (
                  format(dateRange.from, "MMM dd, y")
                )
              ) : (
                <span>Filter by Date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-slate-950 border-white/10" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                setPage(1); // Reset to page 1 on filter change
              }}
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

      <Card className="border-white/5 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-5 py-4">Transaction Details</th>
                <th className="px-5 py-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors border-white/5">
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-lg tracking-tight">
                          {formatCurrency(Number(tx.amount))}
                        </span>
                        <div>
                          {tx.paid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Request ID: {tx.id.split('-')[0]}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-300 font-bold">
                        {format(new Date(tx.requested_at), "dd MMM, yyyy")}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {format(new Date(tx.requested_at), "hh:mm a")}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
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
      </Card>
    </div>
  );
}
