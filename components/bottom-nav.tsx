'use client';

import { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, ClipboardList, Monitor, BookOpen, LayoutDashboard, Receipt, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Navigation items - hoisted outside component to prevent recreation
 */
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders/take', icon: ClipboardList },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Menu', href: '/menu-v2', icon: UtensilsCrossed },
  { name: 'Settings', href: '/settings', icon: Settings },
]);

/**
 * Memoized Nav Item - prevents re-renders when other items change
 */
const NavItemButton = memo(function NavItemButton({ 
  item, 
  isActive 
}: { 
  item: NavItem; 
  isActive: boolean;
}) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      prefetch={true}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg transition-all duration-200 min-w-[56px] active:scale-[0.95] z-10',
        isActive
          ? 'bg-red-500 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800/50'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className={cn('text-[9px] font-semibold', isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400')}>
        {item.name}
      </span>
    </Link>
  );
});

NavItemButton.displayName = 'NavItemButton';

import { useAuth } from '@/lib/auth-context';

/**
 * BottomNav - Optimized with proper memoization and Link prefetching
 * 
 * Key optimizations:
 * 1. Uses Next.js Link with prefetch for instant navigation
 * 2. NAV_ITEMS hoisted to prevent recreation
 * 3. Each nav item is memoized separately
 * 4. Active state computation is memoized
 */
export function BottomNav() {
  const pathname = usePathname();
  const { isKitchen } = useAuth();

  // Memoize active state computation
  const activeStates = useMemo(() => {
    const states = new Map<string, boolean>();
    for (const item of NAV_ITEMS) {
      states.set(item.href, pathname?.startsWith(item.href) ?? false);
    }
    return states;
  }, [pathname]);

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0f1e] border-t border-slate-200 dark:border-slate-800/50 safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-2 pb-safe">
        {NAV_ITEMS.map((item) => (
          <NavItemButton 
            key={item.href} 
            item={item} 
            isActive={activeStates.get(item.href) ?? false} 
          />
        ))}
      </div>
    </nav>
  );
}
