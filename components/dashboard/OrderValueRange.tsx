"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";

interface CategoryData {
  category: string;
  revenue: number;
  percentage: number;
}

export function OrderValueRange({ data }: { data: CategoryData[] }) {
  return (
    <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
      <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-2">
        <CardTitle className="text-sm font-semibold text-white md:text-slate-900 md:dark:text-white flex items-center gap-2">
          <Percent className="h-3.5 w-3.5 text-red-500 md:text-red-600 md:dark:text-red-500" />
          Order Value Range
        </CardTitle>
        <CardDescription className="text-xs md:text-xs text-slate-400 md:text-slate-500 md:dark:text-slate-400">Revenue breakdown</CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:pt-3 md:pb-3">
        {data.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 text-xs py-4 md:py-6">
            No data available
          </p>
        ) : (
          <div className="space-y-3 md:space-y-2.5">
            {data.map((cat, index) => {
              const colors = [
                'from-red-400 to-red-500',
                'from-red-500 to-red-600',
                'from-red-600 to-red-700',
                'from-rose-500 to-rose-600',
              ];
              
              return (
                <div key={index} className="active:bg-slate-50 dark:active:bg-slate-800/50 rounded-lg p-2 md:p-0 -mx-2 md:mx-0 transition-colors">
                  <div className="flex items-center justify-between mb-1.5 md:mb-1">
                    <span className="text-xs md:text-xs font-medium text-slate-600 dark:text-slate-400">
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-2 md:gap-1.5">
                      <Badge variant="outline" className="text-[10px] md:text-xs h-5 md:h-4 px-1.5 md:px-1">
                        {cat.percentage.toFixed(0)}%
                      </Badge>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        ₹{cat.revenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="h-6 md:h-5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colors[index % colors.length]} transition-all`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
