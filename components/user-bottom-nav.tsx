'use client';

import { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LogOut, ShoppingCart, User, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Navigation items - hoisted outside component
 */
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  { name: 'Order', href: '/user/place-order', icon: ShoppingCart },
  { name: 'My Orders', href: '/user/orders', icon: Package },
  { name: 'Khata', href: '/user/khata', icon: Wallet },
  { name: 'Profile', href: '/user/profile', icon: User },
]);

/**
 * Memoized Nav Item
 */
const UserNavItem = memo(function UserNavItem({ 
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
        'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[70px]',
        isActive
          ? 'bg-purple-500 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800/50'
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className={cn('text-[10px] font-semibold', isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400')}>
        {item.name}
      </span>
    </Link>
  );
});

UserNavItem.displayName = 'UserNavItem';

/**
 * Memoized Logout Button
 */
const UserLogoutButton = memo(function UserLogoutButton() {
  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }, []);

  return (
    <button
      onClick={handleLogout}
      className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[70px] text-slate-600 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-800/50"
    >
      <LogOut className="w-5 h-5 shrink-0" />
      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
        Logout
      </span>
    </button>
  );
});

UserLogoutButton.displayName = 'UserLogoutButton';

/**
 * UserBottomNav - Optimized with memoization and prefetching
 */
export function UserBottomNav() {
  const pathname = usePathname();

  // Memoize active states
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
          <UserNavItem
            key={item.href}
            item={item}
            isActive={activeStates.get(item.href) ?? false}
          />
        ))}
        <UserLogoutButton />
      </div>
    </nav>
  );
}
