"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, X, Smartphone, Share, Menu, PlusSquare, Truck } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function DeliveryPWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    console.log('🚚 [Delivery PWA] Install Prompt: Initializing...');
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isStandalone || isInStandaloneMode) {
      console.log('✅ [Delivery PWA] Already installed');
      setIsInstalled(true);
      return;
    }

    // Check for existing deferred prompt
    if ((window as any).deliveryDeferredPrompt) {
        console.log('[Delivery PWA] Found existing deferred prompt');
        setDeferredPrompt((window as any).deliveryDeferredPrompt);
        
        const dismissed = localStorage.getItem('delivery-pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
          setShowButton(true);
        }
    }

    // Check for deferred prompt every 1s for 5s (in case of race conditions)
    const checkInterval = setInterval(() => {
        if ((window as any).deliveryDeferredPrompt) {
            console.log('[Delivery PWA] Found deferred prompt via interval');
            setDeferredPrompt((window as any).deliveryDeferredPrompt);
            
            const dismissed = localStorage.getItem('delivery-pwa-install-dismissed');
            if (!dismissed) {
              setShowPrompt(true);
              setShowButton(true);
            }
            clearInterval(checkInterval);
        }
    }, 1000);

    const checkTimeout = setTimeout(() => clearInterval(checkInterval), 5000);

    // Show button immediately for iOS
    if (isIOS && !isInstalled) {
      const dismissed = localStorage.getItem('delivery-pwa-install-dismissed');
      if (!dismissed) {
        setShowButton(true);
      }
    }

    // Listen for install prompt event
    const handler = (e: Event) => {
      console.log('🎯 [Delivery PWA] beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deliveryDeferredPrompt = e;

      const dismissed = localStorage.getItem('delivery-pwa-install-dismissed');
      
      if (!dismissed) { 
        setShowPrompt(true);
        setShowButton(true);
      }
    };

    const installedHandler = () => {
        console.log('✅ [Delivery PWA] appinstalled event fired');
        setIsInstalled(true);
        setShowPrompt(false);
        setShowButton(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      clearInterval(checkInterval);
      clearTimeout(checkTimeout);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.warn('[Delivery PWA] No deferred prompt available');
      return;
    }

    console.log('[Delivery PWA] Showing install prompt');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[Delivery PWA] User response: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('[Delivery PWA] User accepted the install prompt');
    } else {
      console.log('[Delivery PWA] User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowButton(false);
    localStorage.setItem('delivery-pwa-install-dismissed', Date.now().toString());
    console.log('[Delivery PWA] Install prompt dismissed');
  };

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Dialog */}
      <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">Install Zlice Delivery</DialogTitle>
            <DialogDescription className="text-center">
              {isIOS() ? (
                <>
                  Install Zlice Delivery on your iPhone for:
                  <ul className="mt-4 space-y-2 text-left text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Quick access from home screen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Push notifications for new orders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Faster performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Works offline</span>
                    </li>
                  </ul>
                  
                  <div className="mt-6 rounded-lg bg-sky-50 dark:bg-sky-950 p-4 text-left">
                    <p className="mb-3 text-sm font-semibold">To install:</p>
                    <ol className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white">1</span>
                        <span>Tap the <Share className="inline h-4 w-4" /> Share button below</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white">2</span>
                        <span>Scroll and tap <PlusSquare className="inline h-4 w-4" /> "Add to Home Screen"</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white">3</span>
                        <span>Tap "Add" to confirm</span>
                      </li>
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  Get quick access to your delivery orders with push notifications and offline support.
                  <ul className="mt-4 space-y-2 text-left text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Instant notifications for new orders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Quick access from home screen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Works offline for better reliability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600">✓</span>
                      <span>Faster than browser version</span>
                    </li>
                  </ul>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {!isIOS() && (
              <Button onClick={handleInstall} className="w-full bg-gradient-to-r from-sky-500 to-sky-600">
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            )}
            <Button variant="ghost" onClick={handleDismiss} className="w-full">
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Install Button */}
      {showButton && !showPrompt && (
        <button
          onClick={() => setShowPrompt(true)}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl md:bottom-6"
          aria-label="Install Zlice Delivery"
        >
          <Download className="h-6 w-6" />
        </button>
      )}
    </>
  );
}
