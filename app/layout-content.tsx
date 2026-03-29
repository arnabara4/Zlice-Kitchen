'use client';

import { usePathname } from 'next/navigation';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/sidebar';
import { DeliverySidebar } from '@/components/delivery-sidebar';
import { UserSidebar } from '@/components/user-sidebar';
import { BottomNav } from '@/components/bottom-nav';
import { DeliveryBottomNav } from '@/components/delivery-bottom-nav';
import { UserBottomNav } from '@/components/user-bottom-nav';
import { MobileHeader } from '@/components/mobile-header';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert } from 'lucide-react';

/**
 * Memoized sidebar components to prevent re-renders when children change.
 * Each sidebar is isolated and only re-renders when its own state changes.
 */
const MemoizedSidebar = memo(Sidebar);
const MemoizedDeliverySidebar = memo(DeliverySidebar);
const MemoizedUserSidebar = memo(UserSidebar);
const MemoizedBottomNav = memo(BottomNav);
const MemoizedDeliveryBottomNav = memo(DeliveryBottomNav);
const MemoizedUserBottomNav = memo(UserBottomNav);
const MemoizedMobileHeader = memo(MobileHeader);

MemoizedSidebar.displayName = 'MemoizedSidebar';
MemoizedDeliverySidebar.displayName = 'MemoizedDeliverySidebar';
MemoizedUserSidebar.displayName = 'MemoizedUserSidebar';
MemoizedBottomNav.displayName = 'MemoizedBottomNav';
MemoizedDeliveryBottomNav.displayName = 'MemoizedDeliveryBottomNav';
MemoizedUserBottomNav.displayName = 'MemoizedUserBottomNav';
MemoizedMobileHeader.displayName = 'MemoizedMobileHeader';

/**
 * Route detection helper - extracted for stable reference
 */
function getRouteInfo(pathname: string | null) {
  const isAuthPage = pathname === '/login' || pathname === '/admin' || pathname === '/delivery/login' || pathname === '/user/login' || pathname === '/user/register' || pathname?.startsWith('/verification');
  const isDisplayPage = pathname?.startsWith('/display') ?? false;
  const isDeliveryRoute = (pathname?.startsWith('/delivery') && pathname !== '/delivery/login') ?? false;
  const isUserRoute = (pathname?.startsWith('/user') && pathname !== '/user/login' && pathname !== '/user/register') ?? false;
  
  return { isAuthPage, isDisplayPage, isDeliveryRoute, isUserRoute };
}

/**
 * Static wrapper for sidebar — only re-renders when SidebarComponent reference changes
 * (which only happens when route *type* changes, e.g., delivery → canteen)
 */
const StaticSidebarWrapper = memo(function StaticSidebarWrapper({ 
  SidebarComponent 
}: { 
  SidebarComponent: React.ComponentType 
}) {
  return (
    <div className="hidden xl:block">
      <SidebarComponent />
    </div>
  );
});

StaticSidebarWrapper.displayName = 'StaticSidebarWrapper';

/**
 * LayoutContent - Optimized for minimal re-renders
 * 
 * Key optimizations:
 * 1. Memoized sidebar/bottomnav components
 * 2. useMemo for route detection (only changes when pathname changes)
 * 3. StaticSidebarWrapper prevents sidebar re-renders from pathname changes
 * 4. All hooks called unconditionally (Rules of Hooks)
 */
export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isCanteen, isUnderReview, user } = useAuth();
  
  // Memoize route info to prevent recalculation on unrelated renders
  const { isAuthPage, isDisplayPage, isDeliveryRoute, isUserRoute } = useMemo(
    () => getRouteInfo(pathname),
    [pathname]
  );

  // IMPORTANT: Call all hooks unconditionally before any returns
  // Select correct sidebar based on route type (computed once per pathname change)
  const SidebarComponent = useMemo(() => {
    if (isDeliveryRoute) return MemoizedDeliverySidebar;
    if (isUserRoute) return MemoizedUserSidebar;
    return MemoizedSidebar;
  }, [isDeliveryRoute, isUserRoute]);

  // Select correct bottom nav based on route type
  const BottomNavComponent = useMemo(() => {
    if (isDeliveryRoute) return MemoizedDeliveryBottomNav;
    if (isUserRoute) return MemoizedUserBottomNav;
    return MemoizedBottomNav;
  }, [isDeliveryRoute, isUserRoute]);

  // Should show mobile header
  const showMobileHeader = !isDeliveryRoute && !isUserRoute;

  // Auth/Display pages - minimal layout (return after all hooks are called)
  if (isAuthPage || isDisplayPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e]">
        {children}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f1e]'
    )}>
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - isolated in memo wrapper, won't re-render on page navigation */}
        <StaticSidebarWrapper SidebarComponent={SidebarComponent} />
        
        {/* Main Content with bottom padding for bottom nav on mobile/tablet */}
        <main className="flex-1 overflow-auto pb-16 xl:pb-0 relative">
          {showMobileHeader && <MemoizedMobileHeader />}
          
          {/* Verification Banner for Canteens */}
          {isCanteen && isUnderReview && !isAuthPage && !isDisplayPage && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800/50 px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  Your kitchen is under verification. You can set up your menu and schedules, but customers cannot see your kitchen yet.
                </p>
                {(user?.verification_status === 'pending' || user?.verification_status === 'not_started' || !user?.verification_status) && (
                  <button 
                    onClick={() => window.location.href = '/verification'}
                    className="ml-auto text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md transition-colors"
                  >
                    Start Verification
                  </button>
                )}
                {user?.verification_status === 'rejected' && (
                  <button 
                    onClick={() => window.location.href = '/verification'}
                    className="ml-auto text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors"
                  >
                    Re-verify
                  </button>
                )}
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
      
      {/* Bottom Navigation - shown on mobile and tablet, hidden on desktop */}
      <BottomNavComponent />
    </div>
  );
}
