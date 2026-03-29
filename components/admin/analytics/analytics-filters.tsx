'use client';

import { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Filter,
  Smartphone,
  Monitor,
  Store,
  X,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import type { 
  AnalyticsFilters, 
  OrderSource, 
  DatePreset, 
  DateGranularity,
  CanteenOption 
} from '@/types/analytics';

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  canteens: CanteenOption[];
  loading?: boolean;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

const ORDER_SOURCES: { value: OrderSource; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Orders', icon: null },
  { value: 'zlice', label: 'Zlice App', icon: <Smartphone className="w-3 h-3" /> },
  { value: 'pos', label: 'PoS', icon: <Monitor className="w-3 h-3" /> },
];

const GRANULARITIES: { value: DateGranularity; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

function getIndianDate() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

export const AnalyticsFiltersComponent = memo(({ 
  filters, 
  onFiltersChange,
  canteens,
  loading 
}: AnalyticsFiltersProps) => {
  const [canteenPopoverOpen, setCanteenPopoverOpen] = useState(false);

  const handleDatePresetChange = (preset: DatePreset) => {
    const today = getIndianDate();
    today.setHours(0, 0, 0, 0);

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (preset) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday;
        endDate = yesterday;
        break;
      case '7d':
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        startDate = week;
        endDate = today;
        break;
      case '30d':
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        startDate = month;
        endDate = today;
        break;
      case 'custom':
        // Keep existing dates or set defaults
        startDate = filters.startDate;
        endDate = filters.endDate;
        break;
    }

    onFiltersChange({
      ...filters,
      datePreset: preset,
      startDate,
      endDate,
    });
  };

  const handleOrderSourceChange = (source: OrderSource) => {
    onFiltersChange({ ...filters, orderSource: source });
  };

  const handleCanteenToggle = (canteenId: string) => {
    const current = filters.canteenIds;
    const isAll = current.length === 0 || current.includes('all');
    
    if (canteenId === 'all') {
      onFiltersChange({ ...filters, canteenIds: [] });
    } else if (isAll) {
      onFiltersChange({ ...filters, canteenIds: [canteenId] });
    } else {
      const newIds = current.includes(canteenId)
        ? current.filter(id => id !== canteenId)
        : [...current, canteenId];
      
      // If empty or all selected, reset to all
      if (newIds.length === 0 || newIds.length === canteens.length) {
        onFiltersChange({ ...filters, canteenIds: [] });
      } else {
        onFiltersChange({ ...filters, canteenIds: newIds });
      }
    }
  };

  const handleGranularityChange = (granularity: DateGranularity) => {
    onFiltersChange({ ...filters, granularity });
  };

  const isAllCanteens = filters.canteenIds.length === 0;
  const selectedCanteenCount = isAllCanteens ? canteens.length : filters.canteenIds.length;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters:</span>
      </div>

      {/* Date Preset Pills */}
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESETS.filter(p => p.value !== 'custom').map((preset) => (
          <Button
            key={preset.value}
            variant={filters.datePreset === preset.value ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => handleDatePresetChange(preset.value)}
            disabled={loading}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range */}
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.datePreset === 'custom' ? 'default' : 'outline'} 
              size="sm" 
              className="h-8"
              disabled={loading}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {filters.startDate 
                ? format(filters.startDate, "dd MMM") 
                : "Start"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <CalendarComponent
              mode="single"
              selected={filters.startDate || undefined}
              onSelect={(date) => {
                onFiltersChange({
                  ...filters,
                  datePreset: 'custom',
                  startDate: date || null,
                });
              }}
              disabled={(date) => false}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-slate-400">→</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant={filters.datePreset === 'custom' ? 'default' : 'outline'} 
              size="sm" 
              className="h-8"
              disabled={loading}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {filters.endDate 
                ? format(filters.endDate, "dd MMM") 
                : "End"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <CalendarComponent
              mode="single"
              selected={filters.endDate || undefined}
              onSelect={(date) => {
                onFiltersChange({
                  ...filters,
                  datePreset: 'custom',
                  endDate: date || null,
                });
              }}
              disabled={(date) => {
                if (filters.startDate && date < filters.startDate) return true;
                return false;
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />

      {/* Order Source Toggle */}
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {ORDER_SOURCES.map((source) => (
          <Button
            key={source.value}
            variant={filters.orderSource === source.value ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none h-8 px-3"
            onClick={() => handleOrderSourceChange(source.value)}
            disabled={loading}
          >
            {source.icon}
            <span className={source.icon ? 'ml-1' : ''}>{source.label}</span>
          </Button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />

      {/* Canteen Selector */}
      <Popover open={canteenPopoverOpen} onOpenChange={setCanteenPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-[140px] justify-between"
            disabled={loading}
          >
            <Store className="w-3.5 h-3.5 mr-1.5" />
            {isAllCanteens 
              ? 'All Canteens' 
              : `${selectedCanteenCount} selected`}
            <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 z-50" align="start">
          <div className="max-h-64 overflow-y-auto space-y-1">
            <button
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                isAllCanteens ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => handleCanteenToggle('all')}
            >
              <span className="font-medium">All Canteens</span>
              {isAllCanteens && <Check className="w-4 h-4 text-blue-600" />}
            </button>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
            {canteens.map((canteen) => {
              const isSelected = isAllCanteens || filters.canteenIds.includes(canteen.id);
              return (
                <button
                  key={canteen.id}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    isSelected && !isAllCanteens ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleCanteenToggle(canteen.id)}
                >
                  <span className="truncate">{canteen.name}</span>
                  {isSelected && !isAllCanteens && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />

      {/* Granularity Selector */}
      <Select
        value={filters.granularity}
        onValueChange={(value) => handleGranularityChange(value as DateGranularity)}
        disabled={loading}
      >
        <SelectTrigger className="w-[110px] h-8">
          <SelectValue placeholder="Granularity" />
        </SelectTrigger>
        <SelectContent>
          {GRANULARITIES.map((g) => (
            <SelectItem key={g.value} value={g.value}>
              {g.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {(filters.datePreset !== '7d' || 
        filters.orderSource !== 'all' || 
        !isAllCanteens) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-slate-500"
          onClick={() => {
            onFiltersChange({
              startDate: null,
              endDate: null,
              datePreset: '7d',
              orderSource: 'all',
              canteenIds: [],
              granularity: 'day',
            });
          }}
          disabled={loading}
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
});

AnalyticsFiltersComponent.displayName = 'AnalyticsFilters';

export default AnalyticsFiltersComponent;
