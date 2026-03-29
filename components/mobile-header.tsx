'use client';

import { memo, useMemo } from 'react';
import { OnlineStatusToggle } from '@/components/online-status-toggle';
import { NotificationToggle } from '@/components/ui/notification';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { Building2 } from 'lucide-react';
import Image from 'next/image';

import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

/**
 * MobileHeader - Optimized with memoization
 * 
 * Key optimizations:
 * 1. Memoized auth page detection
 * 2. Stable prop extraction from auth context
 * 3. Early returns for non-render conditions
 */
function MobileHeaderInner() {
  const { user, isSuperAdmin } = useAuth();
  const pathname = usePathname();

  // Memoize auth page detection
  const isAuthPage = useMemo(() => {
    return pathname?.startsWith('/login') || 
           pathname?.startsWith('/delivery/login') ||
           pathname?.startsWith('/user/login') || 
           pathname === '/' ||
           pathname === '' ||
           pathname?.includes('register');
  }, [pathname]);

  const handleLogout = async () => {
    const toastId = toast.loading('Logging out...');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully', { id: toastId });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout', { id: toastId });
    }
  };

  // Early return for pages that don't need header
  if (isAuthPage || isSuperAdmin) return null;

  // Extract stable values
  const userName = user?.name;
  const logoUrl = user?.logo_url;

  return (
    <div className="xl:hidden sticky top-0 z-40 bg-white/80 dark:bg-[#0a0f1e]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pb-2 pt-4 safe-area-top">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              {logoUrl ? (
                <Image 
                  src={logoUrl} 
                  alt={`${userName} Logo`} 
                  width={32} 
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
              {userName || 'Kitchen'}
            </h1>
        </div>
        <div className="flex-shrink-0 flex justify-end gap-2 items-center">
           <OnlineStatusToggle className="py-2 px-3 text-xs" compact />
           <button onClick={handleLogout} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
             <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
           </button>
        </div>
      </div>
    </div>
  );
}

// Memoize the entire component to prevent re-renders from parent
export const MobileHeader = memo(MobileHeaderInner);
MobileHeader.displayName = 'MobileHeader';
