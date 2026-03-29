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

interface OrderChargeDetail {
  orderId: string;
  orderType: string;
  orderValue: number;
  charges: number;
  chargeReason: string;
  formattedTime: string;
  items: string;
}

interface SettlementChargesTableProps {
  orders: OrderChargeDetail[];
  isLoading?: boolean;
}

export function SettlementChargesTable({ orders, isLoading }: SettlementChargesTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-800 bg-slate-900/50 p-4 space-y-3">
         {[1,2,3,4,5].map(i => (
           <div key={i} className="h-10 bg-slate-800/50 rounded animate-pulse" />
         ))}
      </div>
    );
  }

  // Filter out orders that don't have any charges
  const ordersWithCharges = orders.filter(o => o.charges && o.charges > 0);

  if (ordersWithCharges.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
           <p className="text-sm">No extra charges found for this date.</p>
        </div>
     );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/30 shadow-inner overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
        <TableHeader className="bg-slate-950/80 backdrop-blur sticky top-0 z-10">
          <TableRow className="border-b border-white/5 hover:bg-transparent">
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 pl-6 w-[100px]">Time</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[120px]">Order ID</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[100px]">Type</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[250px]">Menu Items</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase tracking-wider text-xs py-4 w-[200px]">Charge Reason</TableHead>
            <TableHead className="text-right text-red-500/80 font-semibold uppercase tracking-wider text-xs py-4 pr-6 w-[120px]">Charge Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersWithCharges.map((order) => (
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
              <TableCell className="text-xs text-slate-400 py-4 max-w-[250px] truncate" title={order.items}>
                {order.items}
              </TableCell>
              <TableCell className="text-xs text-slate-300 py-4 max-w-[200px] truncate" title={order.chargeReason || 'N/A'}>
                {order.chargeReason || <span className="text-slate-600 italic">No reason provided</span>}
              </TableCell>
              <TableCell className="text-right py-4 pr-6">
                 <div className="font-bold text-red-400">
                   {formatCurrency(order.charges)}
                 </div>
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
       </div>
      </div>
    </div>
  );
}
