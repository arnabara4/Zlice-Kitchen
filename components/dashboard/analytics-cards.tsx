"use client";

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Clock, Percent, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopItemsProps {
  items: TopItem[];
}

export const TopItemsCard = memo(({ items }: TopItemsProps) => {
  const maxRevenue = items[0]?.revenue || 1;
  const displayItems = items.slice(0, 7);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="border border-white/5 shadow-lg bg-[#1e1b2e] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <CardHeader className="border-b border-white/5 p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-amber-400" />
                </div>
                Top Selling Items
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">Revenue Leaders (30 Days)</CardDescription>
            </div>
            {items.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] px-2 text-slate-400 hover:text-white hover:bg-white/5"
                onClick={() => setOpen(true)}
              >
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 relative z-10">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {displayItems.length === 0 ? (
                 <p className="text-center text-slate-500 text-xs py-8 border border-dashed border-white/5 rounded-lg bg-white/5">
                    No sales data available yet
                 </p>
            ) : (
            displayItems.map((item, index) => {
              const percentage = (item.revenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="group relative">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={cn(
                      "h-6 w-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 border border-white/5 shadow-inner",
                      index === 0 ? "bg-amber-400 text-amber-950" :
                      index === 1 ? "bg-slate-300 text-slate-900" :
                      index === 2 ? "bg-amber-700 text-amber-100" :
                      "bg-slate-800 text-slate-400"
                    )}>
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium text-slate-200 text-xs truncate leading-tight">
                          {item.name}
                        </p>
                        <span className="font-bold text-slate-200 text-xs">
                           ₹{item.revenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                         <div 
                           className={cn("h-full rounded-full transition-all duration-500", 
                              index === 0 ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" :
                              index === 1 ? "bg-slate-300" :
                              index === 2 ? "bg-amber-700" :
                              "bg-slate-600"
                           )} 
                           style={{ width: `${percentage}%` }} 
                         />
                      </div>
                      <p className="text-[10px] text-slate-500 text-right">
                        {item.quantity} orders
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col bg-[#1e1b2e] border-white/10 text-slate-200">
          <DialogHeader className="border-b border-white/10 pb-4 mb-2">
            <DialogTitle className="text-white">Top Selling Items</DialogTitle>
            <DialogDescription className="text-slate-400">
              Performance breakdown over the last 30 days
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
             <div className="space-y-3">
              {items.map((item, index) => {
                const percentage = (item.revenue / maxRevenue) * 100;
                 return (
                  <div key={index} className="grid grid-cols-[28px_1fr_90px] gap-3 items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md",
                      index < 1 ? "bg-amber-400 text-amber-950" :
                      index < 2 ? "bg-slate-300 text-slate-900" :
                      index < 3 ? "bg-amber-700 text-amber-100" :
                      "bg-slate-800 text-slate-400"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={percentage} className="h-1.5 flex-1 bg-slate-800" indicatorClassName={index < 3 ? "bg-amber-400" : "bg-slate-500"} />
                        <span className="text-[10px] text-slate-500">{item.quantity} sold</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-emerald-400 text-sm">
                        ₹{item.revenue.toLocaleString('en-IN')}
                       </p>
                    </div>
                  </div>
                 )
              })}
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

TopItemsCard.displayName = "TopItemsCard";

interface HourlyData {
  hour: string;
  orders: number;
}

interface PeakHoursProps {
  data: HourlyData[];
}

export const PeakHoursCard = memo(({ data }: PeakHoursProps) => {
  const maxOrders = Math.max(...data.map(d => d.orders), 1);

  return (
    <Card className="border border-white/5 shadow-lg bg-[#1e1b2e] flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="border-b border-white/5 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-red-500/10 rounded-md border border-red-500/20">
              <Clock className="h-3.5 w-3.5 text-red-400" />
            </div>
            Peak Hours
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Today's Traffic</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4 relative z-10">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 border border-dashed border-white/5 rounded-lg bg-white/5">
            <Clock className="h-6 w-6 mb-2 opacity-50" />
            <p className="text-xs">No orders recorded today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data
              .sort((a, b) => b.orders - a.orders)
              .slice(0, 5)
              .map((item, index) => {
                const percentage = (item.orders / maxOrders) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-3 text-xs group/bar">
                    <span className="font-mono text-slate-400 w-12 shrink-0 font-medium">
                      {item.hour}
                    </span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={cn(
                           "h-full rounded-full transition-all duration-700 relative",
                           index === 0 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
                           index === 1 ? "bg-red-500/80" : 
                           "bg-slate-600"
                         )}
                         style={{ width: `${percentage}%` }}
                       />
                    </div>
                    <span className="font-bold text-slate-200 w-8 text-right">
                      {item.orders}
                    </span>
                  </div>
                );
              })
            }
          </div>
        )}
        
        {data.length > 0 && (
           <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-[10px] text-slate-500 text-center">
                 Most active time: <span className="text-red-400 font-bold">{data.sort((a, b) => b.orders - a.orders)[0]?.hour}</span>
              </p>
           </div>
        )}
      </CardContent>
    </Card>
  );
});

PeakHoursCard.displayName = "PeakHoursCard";

interface CategoryData {
  category: string;
  revenue: number;
  percentage: number;
}

interface OrderValueDistributionProps {
  data: CategoryData[];
}

export const OrderValueDistribution = memo(({ data }: OrderValueDistributionProps) => {
  return (
    <Card className="border border-white/5 shadow-lg bg-[#1e1b2e] flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="border-b border-white/5 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/10 rounded-md border border-purple-500/20">
              <Percent className="h-3.5 w-3.5 text-purple-400" />
            </div>
            Order Value Distribution
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Average Order Size</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 relative z-10">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 border border-dashed border-white/5 rounded-lg bg-white/5">
            <Percent className="h-6 w-6 mb-2 opacity-50" />
            <p className="text-xs">No data available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
             {data.map((item, index) => {
               // Determine specific styles for each range
               const isLow = index === 0; // 0-100
               const isMid = index === 1; // 100-200
               const isHigh = index === 2; // 200-500
               const isPremium = index === 3; // 500+

               const colorClass = isLow ? "from-slate-700 to-slate-600 text-slate-300" :
                                  isMid ? "from-indigo-600 to-indigo-500 text-indigo-100" :
                                  isHigh ? "from-purple-600 to-purple-500 text-purple-100" :
                                  "from-amber-500 to-amber-400 text-amber-950";
               
               const borderClass = isLow ? "border-slate-600/30" :
                                   isMid ? "border-indigo-500/30" :
                                   isHigh ? "border-purple-500/30" :
                                   "border-amber-400/30";

               return (
                 <div 
                   key={index} 
                   className={cn(
                     "relative rounded-xl p-3 border flex flex-col justify-between overflow-hidden group/card transition-all hover:-translate-y-1 hover:shadow-lg", 
                     borderClass,
                     "bg-slate-900/50"
                   )}
                 >
                   <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10 group-hover/card:opacity-20 transition-opacity", colorClass)} />
                   
                   <div>
                     <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-1">
                       {item.category}
                     </p>
                      <p className={cn("text-base font-bold", isPremium ? "text-amber-400" : "text-white")}>
                        {Number(item.percentage).toFixed(1)}%
                      </p>
                   </div>
                   
                   <div className="mt-3">
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full bg-gradient-to-r", colorClass)} 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 text-right">
                        ₹{item.revenue.toLocaleString('en-IN')} rev
                      </p>
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OrderValueDistribution.displayName = "OrderValueDistribution";
