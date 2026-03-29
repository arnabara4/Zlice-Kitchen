'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CategoriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/menu-v2?tab=categories');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/30 dark:from-[#020617] dark:via-[#0a0f1e] dark:to-[#0f1419]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-600 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Redirecting to new categories page...</p>
      </div>
    </div>
  );
}
