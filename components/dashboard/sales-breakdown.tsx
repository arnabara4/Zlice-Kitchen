"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, ListFilter, Users, Bike, Utensils } from "lucide-react";

interface SalesBreakdown {
  zlice: { count: number; revenue: number };
  pos: { count: number; revenue: number };
  channels: {
    dineIn: { count: number; revenue: number };
    takeaway: { count: number; revenue: number };
    delivery: { count: number; revenue: number };
  };
}

interface SalesBreakdownProps {
  data: SalesBreakdown;
}

export const SalesBreakdownCard = memo(({ data }: SalesBreakdownProps) => {
  const totalRev = (data.zlice?.revenue || 0) + (data.pos?.revenue || 0);

  // Helper for percentage
  const p = (v: number) => totalRev > 0 ? ((v / totalRev) * 100).toFixed(0) + '%' : '0%';

  return (
    <Card className="border border-white/5 shadow-lg bg-[#1e1b2e] flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="border-b border-white/5 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20">
              <PieChart className="h-3.5 w-3.5 text-blue-400" />
            </div>
            Sales Breakdown
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 font-medium bg-white/5 px-2 py-1 rounded-full">
            ₹{totalRev.toLocaleString('en-IN')}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3 relative z-10">
        {/* Source Breakdown (Zlice vs PoS) */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">By Source</h4>
          <div className="space-y-3">
            {/* Zlice Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 h-5 px-1.5 text-[10px]">Zlice App</Badge>
                   <span className="text-slate-500 text-[10px]">({data.zlice.count} orders)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">₹{data.zlice.revenue.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-500 min-w-[30px] text-right">{p(data.zlice.revenue)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: p(data.zlice.revenue) }} />
              </div>
            </div>

            {/* PoS Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 h-5 px-1.5 text-[10px]">POS Direct</Badge>
                   <span className="text-slate-500 text-[10px]">({data.pos.count} orders)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">₹{data.pos.revenue.toLocaleString('en-IN')}</span>
                   <span className="text-[10px] text-slate-500 min-w-[30px] text-right">{p(data.pos.revenue)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: p(data.pos.revenue) }} />
              </div>
            </div>
          </div>
        </div>

        {/* Channel Breakdown (Stacked Bar) */}
        <div className="pt-4 border-t border-white/5">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">By Channel</h4>
           
           <div className="h-6 w-full flex rounded-lg overflow-hidden border border-white/5">
             {/* Dine In */}
             <div 
               className="bg-purple-600/80 h-full transition-all hover:bg-purple-500 relative group flex items-center justify-center cursor-help" 
               style={{ width: p(data.channels.dineIn.revenue) }}
               title={`Dine-in: ₹${data.channels.dineIn.revenue}`}
             >
                {parseInt(p(data.channels.dineIn.revenue)) > 10 && (
                  <span className="text-[9px] text-white font-bold drop-shadow-md">DI</span>
                )}
             </div>
             
             {/* Takeaway */}
             <div 
               className="bg-pink-600/80 h-full transition-all hover:bg-pink-500 relative group flex items-center justify-center cursor-help" 
               style={{ width: p(data.channels.takeaway.revenue) }}
               title={`Takeaway: ₹${data.channels.takeaway.revenue}`}
             >
                {parseInt(p(data.channels.takeaway.revenue)) > 10 && (
                   <span className="text-[9px] text-white font-bold drop-shadow-md">TA</span>
                )}
             </div>

             {/* Delivery */}
             <div 
               className="bg-emerald-600/80 h-full transition-all hover:bg-emerald-500 relative group flex items-center justify-center cursor-help" 
               style={{ width: p(data.channels.delivery.revenue) }}
               title={`Delivery: ₹${data.channels.delivery.revenue}`}
             >
                {parseInt(p(data.channels.delivery.revenue)) > 10 && (
                   <span className="text-[9px] text-white font-bold drop-shadow-md">DEL</span>
                )}
             </div>
           </div>
           
           <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-600"></div>Dine-in</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-600"></div>Takeaway</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-600"></div>Delivery</div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
});

SalesBreakdownCard.displayName = "SalesBreakdownCard";
