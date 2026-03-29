"use client";

import { useEffect, useState } from "react";

export function HiddenInPWA({ children }: { children: React.ReactNode }) {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    setIsPWA(isStandalone || isIOSStandalone);
  }, []);

  // Hide content if running as PWA
  if (isPWA) {
    return null;
  }

  return <>{children}</>;
}
