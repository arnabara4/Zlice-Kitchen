'use client';

import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface KeyboardShortcutsHintProps {
  className?: string;
}

export function KeyboardShortcutsHint({ className = '' }: KeyboardShortcutsHintProps) {
  const allShortcuts = [
    { category: 'Menu', items: [
      { key: '/', desc: 'Focus search' },
      { key: '↑ / ↓', desc: 'Navigate items' },
      { key: 'Enter / +', desc: 'Add item' },
      { key: '-', desc: 'Subtract item' },
      { key: '1-9', desc: 'Add with quantity' },
      { key: 'M', desc: 'Focus menu panel' },
    ]},
    { category: 'Cart', items: [
      { key: 'C', desc: 'Focus cart' },
      { key: '+ / -', desc: 'Change quantity' },
      { key: 'Del', desc: 'Remove item' },
      { key: '1-9', desc: 'Set quantity' },
    ]},
    { category: 'Order', items: [
      { key: 'D', desc: 'Dine-in' },
      { key: 'T', desc: 'Takeaway' },
      { key: 'Y', desc: 'Delivery' },
      { key: 'P', desc: 'Toggle payment' },
      { key: 'N', desc: 'Focus note' },
      { key: '⌘+Enter', desc: 'Submit order' },
      { key: '⌘+R', desc: 'Reset order' },
    ]},
    { category: 'Orders Panel', items: [
      { key: 'O', desc: 'Focus orders' },
      { key: 'S', desc: 'Update status' },
      { key: 'P', desc: 'Toggle paid' },
      { key: 'B', desc: 'Print bill' },
      { key: 'K', desc: 'Print KOT' },
    ]},
    { category: 'Navigation', items: [
      { key: 'Tab', desc: 'Next section' },
      { key: 'Shift+Tab', desc: 'Prev section' },
      { key: 'Esc', desc: 'Exit/Clear' },
      { key: 'Alt+W', desc: 'Close open tab' },
    ]},
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-full gap-2 justify-start ${className}`}
        >
          <Keyboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl dark:bg-[#1e293b] dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Keyboard className="w-5 h-5 text-red-600 dark:text-red-500" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-4">
          {allShortcuts.map((category) => (
            <div key={category.category}>
              <h4 className="text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                {category.category}
              </h4>
              <div className="space-y-2">
                {category.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <kbd className="self-start px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm min-w-[24px] text-center">
                      {item.key}
                    </kbd>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
