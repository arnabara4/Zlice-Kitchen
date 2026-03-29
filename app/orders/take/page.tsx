'use client';

import { OrderBuilder } from '@/components/order-builder';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';
import Link from 'next/link';

export default function TakeOrderPage() {
  return (
    <div className="h-full bg-slate-50 dark:bg-[#0a0f1e] overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col max-w-full mx-auto w-full xl:px-6 xl:pt-6 xl:pb-6 min-h-0">
        {/* Header - Hidden on mobile/tablet (xl:hidden), shown only on desktop */}
        <div className="hidden xl:flex flex-row justify-between items-center gap-0 mb-6 shrink-0">
          <div>
            <h1 className="text-4xl font-bold text-red-600 dark:text-red-500">Orders Management</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Take orders, edit & update status</p>
          </div>
          <div className="flex gap-3">
            <Link href="/display" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white h-8 lg:h-9 text-xs lg:text-sm">
                <Monitor className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                Customer Display
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800/50 h-8 lg:h-9 text-xs lg:text-sm">Back to Home</Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <OrderBuilder />
        </div>
      </div>
    </div>
  );
}
