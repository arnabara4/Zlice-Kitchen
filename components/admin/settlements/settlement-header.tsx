'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon, RefreshCw, Info, ChevronDown, RotateCcw, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { AddChargeModal } from './add-charge-modal';

interface SettlementHeaderProps {
  /** The selected date formatted for display */
  selectedDateFormatted: string;
  loading: boolean;
  onRefresh: () => void;
  /** Callback when user selects a date range */
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Currently selected date range */
  dateRange: DateRange | undefined;
  /** List of canteens for adding charges */
  canteens: Array<{ id: string; name: string }>;
}

export const SettlementHeader = memo(({
  selectedDateFormatted,
  loading,
  onRefresh,
  onDateRangeChange,
  dateRange,
  canteens,
}: SettlementHeaderProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleReset = () => {
    onDateRangeChange(undefined); // Reset to default (today)
  };

  const formatDateDisplay = (range: DateRange | undefined) => {
    if (!range) return 'All Time';
    if (!range?.from) return 'All Time';
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return format(range.from, 'dd MMM yyyy');
    }
    return `${format(range.from, 'dd MMM')} - ${format(range.to, 'dd MMM yyyy')}`;
  };

  return (
    <div className="mb-6">
      {/* Title and Description */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
          <CalendarIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Settlement Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review and process canteen settlements
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/admin/canteens/settlements/charges">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              All Charges
            </Button>
          </Link>
          <AddChargeModal 
            canteens={canteens} 
            onChargeAdded={onRefresh} 
          />
        </div>
      </div>

      {/* Settlement Date Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Date:
                </span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {selectedDateFormatted || 'Loading...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Range Picker */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 min-w-[200px] justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {formatDateDisplay(dateRange)}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="end">
                  <CalendarComponent
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={onDateRangeChange}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Reset Button (only shown if a specific date range is selected) */}
              {dateRange?.from && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1 text-emerald-600 hover:text-emerald-700"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

SettlementHeader.displayName = 'SettlementHeader';
