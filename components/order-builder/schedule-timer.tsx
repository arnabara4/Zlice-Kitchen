"use client";

import { useState, useEffect, memo } from "react";
import { Clock, AlertCircle } from "lucide-react";

export const ScheduleTimer = memo(function ScheduleTimer({ 
  schedule, 
  targetDateStr,
  variant = "default",
  scheduleName
}: { 
  schedule: any, 
  targetDateStr: string,
  variant?: "default" | "arrival",
  scheduleName?: string
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    if (!schedule || !schedule.end_time || !schedule.prep_time) return;

    const checkTime = () => {
      const [hours, minutes, seconds] = schedule.end_time.split(':').map(Number);
      const targetDate = new Date(`${targetDateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00+05:30`);
      const now = new Date();
      
      if (now > targetDate) {
        setIsPassed(true);
        const completionDate = new Date(targetDate.getTime() + schedule.prep_time * 60000);
        const diff = completionDate.getTime() - now.getTime();
        setTimeLeft(Math.max(0, diff));
      } else {
        setIsPassed(false);
        setTimeLeft(null);
      }
    };
    
    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [schedule, targetDateStr]);

  if (!schedule) return null;
  if (!isPassed) return null;
  
  if (timeLeft !== null && timeLeft <= 0) {
     return (
       <div className={`${variant === 'arrival' ? 'text-xs px-3 py-2' : 'text-[10px] px-1.5 py-0.5'} text-red-600 font-bold bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 whitespace-nowrap flex items-center gap-2`}>
         <AlertCircle className="w-4 h-4" />
         Overdue! Rider arriving!
       </div>
     );
  }

  if (timeLeft === null) return null;

  const m = Math.floor(timeLeft / 60000);
  const s = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className={`flex items-center gap-2 ${variant === 'arrival' ? 'text-xs px-3 py-2 bg-amber-100 dark:bg-amber-900/40' : 'text-[10px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20'} text-amber-700 dark:text-amber-400 rounded font-bold border border-amber-200 dark:border-amber-800/50 whitespace-nowrap shadow-sm`}>
      <Clock className="w-4 h-4" />
      <span>{m}:{s.toString().padStart(2, '0')} min</span>
      {variant === 'arrival' ? (
        <span>(Rider for {scheduleName || schedule.name} order will arrive in approx)</span>
      ) : (
        <span className="opacity-70">(Rider will arrive approx)</span>
      )}
    </div>
  );
});
