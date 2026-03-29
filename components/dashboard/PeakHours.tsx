"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface HourlyData {
  hour: string;
  orders: number;
}

export function PeakHours({ data }: { data: HourlyData[] }) {
  const sortedData = [...data].sort((a, b) => b.orders - a.orders).slice(0, 8);
  const maxOrders = Math.max(...data.map(d => d.orders), 1);

  return (
    <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
      <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-2">
        <CardTitle className="text-sm font-semibold text-white md:text-slate-900 md:dark:text-white flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-red-500 md:text-red-600 md:dark:text-red-500" />
          Peak Hours Today
        </CardTitle>
        <CardDescription className="text-xs md:text-xs text-slate-400 md:text-slate-500 md:dark:text-slate-400">Busiest times</CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:pt-3 md:pb-3">
        {data.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 text-xs py-4 md:py-6">
            No orders yet today
          </p>
        ) : (
          <div className="space-y-1.5 md:space-y-1">
            {sortedData.map((item, index) => {
              const percentage = (item.orders / maxOrders) * 100;
              
              return (
                <div key={index} className="flex items-center gap-2 active:bg-slate-50 dark:active:bg-slate-800/50 rounded-lg p-1 md:p-0 -mx-1 md:mx-0 transition-colors">
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 w-10 md:w-10">
                    {item.hour}
                  </span>
                  <div className="flex-1">
                    <div className="h-6 md:h-5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 transition-all flex items-center justify-end pr-1.5"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 25 && (
                          <span className="text-xs font-semibold text-white">
                            {item.orders}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white w-6 text-right">
                    {item.orders}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
