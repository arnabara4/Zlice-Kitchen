import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Bike, CheckCircle, Clock, XCircle } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  canteen_price: number;
  menu_items: {
    name: string;
  };
}

interface User {
  name: string;
  phone: string;
  roll_number: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  totalAmount: number; // Calculated total
  itemsTotal: number;
  packagingFee: number;
  gstAmount: number;
  users: User;
  order_items: OrderItem[];
}

interface RecentOrdersTableProps {
  orders: Order[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Delivered</Badge>;
      case "pending":
      case "preparing":
      case "ready":
        return <Badge className="bg-orange-500 hover:bg-orange-600"><Clock className="w-3 h-3 mr-1" /> Active</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm border-t border-slate-100 dark:border-slate-800">
        No orders found for the selected period.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
          <TableRow>
            <TableHead className="w-[100px]">Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Items</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium text-xs md:text-sm">
                #{order.order_number}
              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {format(new Date(order.created_at), "dd MMM, hh:mm a")}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium">{order.users?.name || "Guest"}</span>
                  <span className="text-[10px] text-slate-500">{order.users?.roll_number}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-slate-500 max-w-[200px] truncate">
                 {order.order_items.map(item => `${item.quantity}x ${item.menu_items.name}`).join(", ")}
              </TableCell>
              <TableCell className="font-semibold text-xs md:text-sm">
                ₹{order.totalAmount?.toLocaleString('en-IN')}
              </TableCell>
              <TableCell>
                {getStatusBadge(order.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
