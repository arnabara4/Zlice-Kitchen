"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/financial-utils";

interface OrderDetail {
  orderId: string;
  orderType: string;
  orderValue: number;
  platformFee: number;
  netCanteenAmount: number;
  settlementStatus: string;
  formattedTime: string;
  items: string;
  packagingAmount: number;
  deliveryAmount: number;
}

interface SettlementDetailTableProps {
  orders: OrderDetail[];
  isLoading?: boolean;
}

export function SettlementDetailTable({ orders, isLoading }: SettlementDetailTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-800 bg-slate-900/50 p-4 space-y-3">
         {[1,2,3,4,5].map(i => (
           <div key={i} className="h-10 bg-slate-800/50 rounded animate-pulse" />
         ))}
      </div>
    );
  }

  if (orders.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
           <p className="text-sm">No orders found for this date.</p>
        </div>
     );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden shadow-inner">
      <Table>
        <TableHeader className="bg-slate-950/80 backdrop-blur sticky top-0 z-10">
          <TableRow className="border-b border-white/5 hover:bg-transparent">
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 pl-6 w-[100px]">Time</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[120px]">Order ID</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[100px]">Type</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[300px]">Menu Items</TableHead>
            <TableHead className="text-right text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[80px]">Pkg</TableHead>
            <TableHead className="text-right text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[80px]">Del</TableHead>
            <TableHead className="text-right text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 pr-6 w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.orderId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
              <TableCell className="font-mono text-xs text-slate-500 py-4 pl-6">
                {order.formattedTime}
              </TableCell>
              <TableCell className="font-medium text-slate-300 py-4">
                #{order.orderId.substring(0, 8)}
              </TableCell>
              <TableCell className="py-4">
                 <Badge variant="outline" className={`
                    text-[10px] uppercase tracking-widest font-semibold bg-transparent px-2.5 py-1 rounded-md border
                    ${order.orderType === 'dine_in' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 
                      order.orderType === 'takeaway' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 
                      'text-red-400 border-red-500/20 bg-red-500/5'
                    }
                 `}>
                    {order.orderType?.replace('_', ' ')}
                 </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-400 py-4 max-w-[300px] truncate" title={order.items}>
                {order.items}
              </TableCell>
              <TableCell className="text-right text-slate-400 text-xs py-4 font-mono">
                {order.packagingAmount > 0 ? formatCurrency(order.packagingAmount) : '-'}
              </TableCell>
              <TableCell className="text-right text-slate-400 text-xs py-4 font-mono">
                {order.deliveryAmount > 0 ? formatCurrency(order.deliveryAmount) : '-'}
              </TableCell>
              <TableCell className="text-right py-4 pr-6">
                <Badge className={`
                   hover:bg-opacity-80 transition-all px-3 py-1 rounded-full shadow-lg
                   ${order.settlementStatus === 'Paid' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_-3px_rgba(245,158,11,0.3)]'}
                `}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${order.settlementStatus === 'Paid' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  {order.settlementStatus}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
