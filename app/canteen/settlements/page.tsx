
"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Wallet, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/financial-utils";

// Types matching API response
interface SettlementOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  type: string;
  totalAmount: number;
  settlementAmount: number;
  status: string;
  settlementDate: string;
  couponCode?: string;
}

interface SettlementSummary {
  settlementDate: string;
  orderQueryStart: string;
  orderQueryEnd: string;
  totalOrders: number;
  totalAmount: number;
  settledAmount: number;
  pendingAmount: number;
  status: string;
}

export default function CanteenSettlementsPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SettlementOrder[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);

  const fetchSettlements = useCallback(async (selectedDate: Date | undefined) => {
    try {
      setLoading(true);
      const queryParam = selectedDate ? `?date=${selectedDate.toISOString().split('T')[0]}` : '';
      const res = await fetch(`/api/canteen/settlements${queryParam}`);
      
      if (!res.ok) throw new Error("Failed to fetch settlements");
      
      const data = await res.json();
      setOrders(data.orders || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settlement data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements(date);
  }, [date, fetchSettlements]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Settlements</h2>
          <p className="text-muted-foreground">
            Track your payouts and settlement history from Zlice (T+2 Schedule)
          </p>
        </div>
        
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a settlement date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
            <div className="p-2 border-t text-center">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setDate(undefined)}>
                Clear Date (View All Time)
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payable Amount</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {formatCurrency(summary?.totalAmount || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
               For {summary?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Status</CardTitle>
            {summary?.status === 'Pending' ? (
                <Clock className="h-4 w-4 text-yellow-500" />
            ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
            </CardHeader>
            <CardContent>
            {loading ? (
                <Skeleton className="h-7 w-24" />
            ) : (
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-2xl font-bold",
                        summary?.status === 'Pending' ? "text-yellow-600" : "text-emerald-600"
                    )}>
                        {summary?.pendingAmount === 0 && (summary?.totalAmount || 0) > 0 
                            ? "Paid" 
                            : summary?.totalAmount === 0 
                                ? "No Dues" 
                                : "Pending"}
                    </span>
                </div>
            )}
             <p className="text-xs text-muted-foreground mt-1">
               {summary?.settledAmount ? `Paid: ${formatCurrency(summary.settledAmount)}` : 'Wait for payout'}
            </p>
            </CardContent>
        </Card>

        <Card className="col-span-2">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Period</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
                <div className="space-y-1">
                    <p className="text-sm">
                        Orders placed between:
                    </p>
                    <p className="font-semibold">
                        {summary?.orderQueryStart && summary.orderQueryStart !== 'All Time' 
                          ? format(new Date(summary.orderQueryStart), "MMM d, h:mm a") 
                          : 'Beginning of Time'} 
                        {' '}&rarr;{' '}
                        {summary?.orderQueryEnd && summary.orderQueryEnd !== 'All Time' 
                          ? format(new Date(summary.orderQueryEnd), "MMM d, h:mm a") 
                          : 'Present'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        *Based on T+2 working day settlement cycle
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Included in This Settlement</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Coupon</TableHead>
                <TableHead>Order Total</TableHead>
                <TableHead className="text-right text-emerald-600 font-bold">Your Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No Zlice orders found for this settlement period.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-xs text-muted-foreground">
                        {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="capitalize">
                            {order.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        {order.couponCode ? (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {order.couponCode}
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </TableCell>
                    <TableCell>
                        {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                        {formatCurrency(order.settlementAmount)}
                    </TableCell>
                    <TableCell>
                        <Badge variant={order.status === 'Settled' ? 'default' : 'secondary'} 
                            className={order.status === 'Settled' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                            {order.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
