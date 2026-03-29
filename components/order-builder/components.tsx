"use client";

import { memo } from "react";
import { Plus, Minus, Trash2, Clock, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  canteen_price: number;
  quantity: number;
}

/** Memoized Menu Item Button */
export const MenuItemButton = memo(function MenuItemButton({
  item,
  isSelected,
  quantity,
  onAdd,
}: {
  item: MenuItem;
  isSelected: boolean;
  quantity: number;
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <div
      className={`h-auto p-3 flex flex-col justify-between gap-3 transition-all rounded-xl relative bg-white dark:bg-slate-900 border cursor-pointer active:scale-[0.98] ${
        isSelected
          ? "border-red-500 shadow-sm ring-1 ring-red-500/20"
          : "border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-700"
      }`}
      onClick={() => onAdd(item)}>
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
          {quantity}
        </div>
      )}
      <div>
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-tight">
          {item.name}
        </p>
        <p className="text-red-600 dark:text-red-400 font-bold mt-1">
          ₹{item.price.toFixed(0)}
        </p>
      </div>
      <Button
        size="sm"
        className="w-full h-8 bg-red-600 hover:bg-red-700 text-white text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(item);
        }}>
        <Plus className="w-3 h-3 mr-1" /> Add
      </Button>
    </div>
  );
});

/** Memoized Cart Item */
export const CartItem = memo(function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: OrderItem;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemove: (menuItemId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-100 dark:bg-[#0f172a] p-2 md:p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-red-500 dark:hover:border-red-500 transition-colors">
      <div className="flex-1 min-w-0 mr-2">
        <p className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200 truncate">
          {item.name}
        </p>
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
          ₹{item.canteen_price.toFixed(2)} each
        </p>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateQuantity(item.menuItemId, -1)}
          className="h-6 w-6 md:h-8 md:w-8 p-0 dark:border-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-500">
          <Minus className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
        <span className="font-bold text-xs md:text-sm w-4 md:w-6 text-center text-slate-800 dark:text-slate-200">
          {item.quantity}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateQuantity(item.menuItemId, 1)}
          className="h-6 w-6 md:h-8 md:w-8 p-0 dark:border-slate-700/50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-500">
          <Plus className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(item.menuItemId)}
          className="h-6 w-6 md:h-8 md:w-8 p-0 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      </div>
      <p className="font-bold text-xs md:text-sm text-red-600 dark:text-red-400 ml-2 min-w-[50px] md:min-w-[60px] text-right">
        ₹{(item.canteen_price * item.quantity).toFixed(2)}
      </p>
    </div>
  );
});

/** Loading Skeletons */
export const OrdersSkeleton = memo(function OrdersSkeleton() {
  return (
    <div className="space-y-3 p-3 md:p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-4">
          <div className="flex gap-3">
            <Skeleton className="h-20 w-1 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-32" /></div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export const MenuGridSkeleton = memo(function MenuGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 p-4 md:p-8">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
          <div className="space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-5 w-16" /><Skeleton className="h-8 w-full rounded-lg" /></div>
        </div>
      ))}
    </div>
  );
});

/** Empty States */
export const EmptyOrdersState = memo(function EmptyOrdersState() {
  return (
    <div className="col-span-full text-center py-12 md:py-16">
      <div className="max-w-sm mx-auto px-4">
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto mb-4 md:mb-6">
          <Clock className="w-10 h-10 md:w-12 md:h-12 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Active Orders</h3>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-6">All caught up! Start creating new orders below.</p>
      </div>
    </div>
  );
});

export const EmptyMenuState = memo(function EmptyMenuState({ searchQuery = "" }: { searchQuery?: string }) {
  return (
    <div className="col-span-full text-center py-12">
      <div className="max-w-sm mx-auto px-4">
        <div className="bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">{searchQuery ? "No Items Found" : "No Menu Items"}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{searchQuery ? "Try a different search term" : "Add menu items to start taking orders"}</p>
      </div>
    </div>
  );
});
