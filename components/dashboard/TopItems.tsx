"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UtensilsCrossed } from "lucide-react";

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

export function TopItems({ items }: { items: TopItem[] }) {
  return (
    <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
      <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-2">
        <CardTitle className="text-sm font-semibold text-white md:text-slate-900 md:dark:text-white flex items-center gap-2">
          <UtensilsCrossed className="h-3.5 w-3.5 text-red-500 md:text-red-600 md:dark:text-red-500" />
          Top Items (7D)
        </CardTitle>
        <CardDescription className="text-xs md:text-xs text-slate-400 md:text-slate-500 md:dark:text-slate-400">Best sellers</CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:pt-3 md:pb-3">
        <div className="space-y-2 md:space-y-2">
          {items.map((item, index) => {
            const maxRevenue = items[0]?.revenue || 1;
            const percentage = (item.revenue / maxRevenue) * 100;
            
            return (
              <div key={index} className="flex items-center gap-2 md:gap-1.5 active:bg-slate-50 dark:active:bg-slate-800/50 rounded-lg p-2 md:p-0 -mx-2 md:mx-0 transition-colors">
                <div className={`h-6 w-6 md:h-5 md:w-5 rounded flex items-center justify-center font-bold text-white text-xs shrink-0 ${
                  index === 0 ? "bg-amber-500" :
                  index === 1 ? "bg-slate-400" :
                  index === 2 ? "bg-amber-700" :
                  "bg-slate-500"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-xs truncate leading-tight">
                    {item.name}
                  </p>
                  <Progress value={percentage} className="h-1.5 md:h-1 mt-1" />
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                    {item.quantity}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
