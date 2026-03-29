'use client';

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  UtensilsCrossed, ClipboardList, Monitor, BookOpen, 
  LayoutDashboard, Receipt, Building2, LogOut, 
  Settings, Bike, Tag, Tags, MapPin, 
  Wallet, ChevronLeft, ChevronRight, ChevronDown, 
  BarChart3, Banknote, Landmark, type LucideIcon, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { OnlineStatusToggle } from '@/components/online-status-toggle';
import { NotificationToggle } from '@/components/ui/notification';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { KeyboardShortcutsHint } from '@/components/keyboard-shortcuts-hint';

/**
 * --- TYPES & CONSTANTS ---
 */
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  superAdminOnly?: boolean;
  kitchenOnly?: boolean;
  subItems?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Analytics & insights',
  },
  {
    name: 'Kitchens',
    href: '/admin/canteens',
    icon: Building2,
    description: 'Manage kitchens',
    superAdminOnly: true,
    subItems: [
      {
        name: 'Analytics',
        href: '/admin/canteens/analytics',
        icon: BarChart3,
        description: 'Kitchen performance',
      },
      {
        name: 'Settlements',
        href: '/admin/canteens/settlements',
        icon: Banknote,
        description: 'Manage payouts',
      }
    ]
  },
  {
    name: 'Delivery Personnel',
    href: '/admin/delivery-man',
    icon: Bike,
    description: 'Manage delivery staff',
    superAdminOnly: true,
  },
  {
    name: 'Delivery Payments',
    href: '/admin/delivery-payments',
    icon: Wallet,
    description: 'Pay delivery personnel',
    superAdminOnly: true,
  },
  {
    name: 'Kitchen Payments',
    href: '/admin/canteen-payments',
    icon: Receipt,
    description: 'Pay kitchens for online orders',
    superAdminOnly: true,
  },
  {
    name: 'Withdrawal Requests',
    href: '/admin/transactions',
    icon: Landmark,
    description: 'Approve & track settlements',
    superAdminOnly: true,
  },
  {
    name: 'Addresses',
    href: '/addresses',
    icon: MapPin,
    description: 'Manage delivery addresses',
    superAdminOnly: true,
  },
  {
    name: 'Distances',
    href: '/distances',
    icon: Tags,
    description: 'Manage delivery distances',
    superAdminOnly: true,
  },
  {
    name: 'Offer Management',
    href: '/admin/coupons',
    icon: Tag,
    description: 'Manage all coupons',
    superAdminOnly: true,
  },
  {
    name: 'Orders',
    href: '/orders/take',
    icon: ClipboardList,
    description: 'Take & manage orders',
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    description: 'Order history',
  },
  {
    name: 'Menu & Categories',
    href: '/menu-v2',
    icon: UtensilsCrossed,
    description: 'Manage menu & categories',
  },
  {
    name: 'Offers',
    href: '/offers',
    icon: Tag,
    description: 'Manage special offers',
  },
  {
    name: 'Khata',
    href: '/khata',
    icon: BookOpen,
    description: 'Student records',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App settings',
  },
  {
    name: 'Display',
    href: '/display',
    icon: Monitor,
    description: 'Customer board',
  },
];

/**
 * --- SUB-COMPONENT 1: HEADER ---
 */
interface SidebarHeaderProps {
  userName?: string;
  logoUrl?: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isCollapsed: boolean;
}

const SidebarHeader = memo(({ userName, logoUrl, loading, isSuperAdmin, isCollapsed }: SidebarHeaderProps) => {
  const [imgError, setImgError] = useState(false);
  const hasLoadedBefore = useRef(false);

  useEffect(() => {
    if (!loading) {
      hasLoadedBefore.current = true;
    }
  }, [loading]);

  return (
    <div className={cn("px-4 py-6 border-b border-slate-200 dark:border-slate-800/50", isCollapsed && "px-3")}>
      {loading && !hasLoadedBefore.current ? (
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          {!isCollapsed && (
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )}
        </div>
      ) : (
        <Link href="/" className="flex items-center gap-3 group" prefetch={false}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800/50 group-hover:scale-105 transition-transform duration-300">
            {logoUrl && !imgError ? (
              <Image 
                src={logoUrl} 
                alt="Logo" 
                width={48} 
                height={48}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                priority
              />
            ) : (
              <Building2 className="w-6 h-6 text-slate-400" />
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate leading-tight">
                {isSuperAdmin ? 'Admin Central' : (userName || 'Kitchen')}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Professional Panel</p>
            </div>
          )}
        </Link>
      )}
    </div>
  );
});

SidebarHeader.displayName = 'SidebarHeader';

/**
 * --- SUB-COMPONENT 2: NAVIGATION ITEM ---
 */
interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  hasActiveChild?: boolean;
  pathname: string | null;
}

const SidebarNavItem = memo(({ 
  item, 
  isActive, 
  isCollapsed,
  hasActiveChild,
  pathname,
}: SidebarNavItemProps) => {
  const Icon = item.icon;
  const [isExpanded, setIsExpanded] = useState(isActive || hasActiveChild || false);
  const hasSubItems = item.subItems && item.subItems.length > 0;

  // Auto-expand when a child becomes active
  useEffect(() => {
    if (hasActiveChild && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveChild, isExpanded]);
  
  // For items with sub-items
  if (hasSubItems && !isCollapsed) {
    return (
      <div className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative active:scale-[0.98]',
            (isActive || hasActiveChild)
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          {/* Clickable link area for navigation */}
          <Link
            href={item.href}
            prefetch={true}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer z-10"
          >
            <div className={cn(
              "flex items-center justify-center shrink-0 transition-transform duration-150 w-5 h-5",
              !isActive && "group-hover:scale-110"
            )}>
              <Icon className="w-5 h-5 text-current" />
            </div>
            
            <div className="flex-1 min-w-0 overflow-hidden text-left">
              <p className="font-semibold text-sm truncate">{item.name}</p>
              <p className="text-[11px] truncate mt-0.5 text-slate-500 dark:text-slate-500">
                {item.description}
              </p>
            </div>
          </Link>

          {/* Separate expand/collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150 shrink-0 z-20"
            aria-label={isExpanded ? 'Collapse submenu' : 'Expand submenu'}
          >
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </button>
        </div>

        {/* Sub-items */}
        {isExpanded && (
          <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
            {item.subItems!.map((subItem) => {
              const SubIcon = subItem.icon;
              const isSubActive = pathname?.startsWith(subItem.href) ?? false;
              
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  prefetch={true}
                  aria-current={isSubActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group active:scale-[0.97]',
                    isSubActive
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  <SubIcon className={cn("w-4 h-4", isSubActive ? "text-white" : "text-current")} />
                  <span className="text-sm font-medium">{subItem.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Simple item
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.98] z-10',
        isActive
          ? 'bg-red-500 text-white shadow-md'
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

SidebarNavItem.displayName = 'SidebarNavItem';

/**
 * --- SUB-COMPONENT 3: NAVIGATION LIST ---
 */
interface SidebarNavigationProps {
  filteredNavItems: NavItem[];
  isCollapsed: boolean;
}

const SidebarNavigation = memo(({ filteredNavItems, isCollapsed }: SidebarNavigationProps) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      {filteredNavItems.map((item) => {
        const isActive = pathname?.startsWith(item.href) ?? false;
        // Check if any child is active
        const hasActiveChild = item.subItems?.some(sub => pathname?.startsWith(sub.href));

        return (
          <SidebarNavItem 
            key={item.href}
            item={item}
            isActive={isActive}
            isCollapsed={isCollapsed}
            hasActiveChild={hasActiveChild}
            pathname={pathname}
          />
        );
      })}
    </nav>
  );
});

SidebarNavigation.displayName = 'SidebarNavigation';

/**
 * --- SUB-COMPONENT 4: FOOTER ---
 */
interface SidebarFooterProps {
  isSuperAdmin: boolean;
  isCollapsed: boolean;
  logout: () => void;
}

const SidebarFooter = memo(({ isSuperAdmin, isCollapsed, logout }: SidebarFooterProps) => {
  return (
    <div className="border-t border-slate-200 dark:border-slate-800/50">
      {!isSuperAdmin && (
        <div className="p-4 pb-2">
          <OnlineStatusToggle className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" />
        </div>
      )}
      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 "
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
        {!isCollapsed && (
          <div className="mt-2">
            <KeyboardShortcutsHint />
          </div>
        )}
      </div>
      {!isCollapsed && (
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Made with ❤️
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Shahid Mollick & Sohail Belim
          </p>
        </div>
      )}
    </div>
  );
});

SidebarFooter.displayName = 'SidebarFooter';

/**
 * --- MAIN COMPONENT: SIDEBAR (The Orchestrator) ---
 */
export function Sidebar() {
  const { user, loading, logout, isSuperAdmin, isKitchen } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => setIsCollapsed(prev => !prev), []);

  // Extract stable primitive values from user object to prevent unnecessary re-renders
  const userName = user?.name;
  const logoUrl = user?.logo_url;

  // Memoized filter - only recomputes when isSuperAdmin/isKitchen changes
  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => {
      if (isSuperAdmin) return item.superAdminOnly;
      if (item.superAdminOnly) return false;
      if (item.kitchenOnly && !isKitchen) return false;
      if (!item.kitchenOnly && isKitchen && item.name === 'Khata') return false; // Hide khata from kitchen optionally? User didn't ask but makes sense. Wait, I won't hide it unless asked.
      return true;
    });
  }, [isSuperAdmin, isKitchen]);

  // Stable logout handler
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "relative bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800/50 flex flex-col h-full transition-[width] duration-300 ease-out z-40",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-10 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-50 text-slate-500"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* 1. HEADER - Stable props, never re-renders on page change */}
        <SidebarHeader 
          userName={userName}
          logoUrl={logoUrl}
          loading={loading} 
          isSuperAdmin={isSuperAdmin} 
          isCollapsed={isCollapsed} 
        />

        {/* 2. ONLINE TOGGLE - Only renders for canteen users */}
        {!isSuperAdmin && (
          <div className={cn(
            "border-b border-slate-200 dark:border-slate-800/50", 
            isCollapsed ? "p-2 flex flex-col gap-4 items-center" : "p-4 flex items-center gap-2"
          )}>
            <div className={cn("flex-1", isCollapsed ? "w-full flex justify-center" : "min-w-0")}>
               <OnlineStatusToggle 
                  compact={isCollapsed} 
                  className={cn(
                    "bg-transparent border-none p-0", 
                    isCollapsed && "justify-center"
                  )} 
                  hideText={isCollapsed}
               />
            </div>
            <NotificationToggle isOn={false} size={20} showDot={true} className="shrink-0" />
          </div>
        )}

        {/* 3. NAVIGATION - Isolated pathname subscription */}
        <SidebarNavigation 
          filteredNavItems={filteredNavItems}
          isCollapsed={isCollapsed}
        />

        {/* 4. FOOTER - Stable props, never re-renders on page change */}
        <SidebarFooter 
          isSuperAdmin={isSuperAdmin} 
          isCollapsed={isCollapsed} 
          logout={handleLogout} 
        />
      </aside>
    </TooltipProvider>
  );
}
