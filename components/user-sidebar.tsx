'use client';

import { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LogOut, User, ShoppingCart, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

/**
 * Navigation items - hoisted outside component
 */
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const NAV_ITEMS: readonly NavItem[] = Object.freeze([
  {
    name: 'Place Order',
    href: '/user/place-order',
    icon: ShoppingCart,
    description: 'Browse menu and order',
  },
  {
    name: 'My Orders',
    href: '/user/orders',
    icon: Package,
    description: 'View your order history',
  },
  {
    name: 'My Khata',
    href: '/user/khata',
    icon: Wallet,
    description: 'View account balance',
  },
  {
    name: 'Profile',
    href: '/user/profile',
    icon: User,
    description: 'Manage your account',
  },
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
        'flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-purple-500 text-white shadow-md'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{item.name}</p>
        <p className={cn('text-xs', isActive ? 'text-white/90' : 'text-slate-500 dark:text-slate-400')}>
          {item.description}
        </p>
      </div>
    </Link>
  );
});

UserNavItem.displayName = 'UserNavItem';

/**
 * UserSidebar - Optimized with memoization and prefetching
 */
export function UserSidebar() {
  const pathname = usePathname();

  // Memoize active states
  const activeStates = useMemo(() => {
    const states = new Map<string, boolean>();
    for (const item of NAV_ITEMS) {
      states.set(item.href, pathname?.startsWith(item.href) ?? false);
    }
    return states;
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/user/login';
  }, []);

  return (
    <aside className="hidden xl:flex w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800/50 flex-col h-screen sticky top-0">
      {/* Logo Section */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/50">
        <div className="flex items-center justify-between">
          <Link href="/user/orders" className="flex items-center gap-3 group flex-1">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-105 transition-all duration-200">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                User Portal
              </h1>
            </div>
          </Link>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAV_ITEMS.map((item) => (
          <UserNavItem
            key={item.href}
            item={item}
            isActive={activeStates.get(item.href) ?? false}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800/50">
        <div className="p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 text-purple-600" />
            Logout
          </Button>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Made with ❤️
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Shahid Mollick & Sohail Belim
          </p>
        </div>
      </div>
    </aside>
  );
}
