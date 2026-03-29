"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, X, Bike, Share, Menu, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function DeliveryPWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);

  useEffect(() => {
    console.log('🔧 Delivery PWA Install: Initializing...');
    
    // Check if already installed as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isStandalone || isInStandaloneMode) {
      console.log('✅ Delivery PWA already installed');
      setIsInstalled(true);
      return;
    }

    // Check for existing deferred prompt for delivery app
    if ((window as any).deliveryDeferredPrompt) {
      console.log('Found existing delivery deferred prompt');
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
        console.log('Found delivery deferred prompt via interval');
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
      console.log('🎯 Delivery beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deliveryDeferredPrompt = e;

      // Check if user has dismissed recently
      const dismissed = localStorage.getItem('delivery-pwa-install-dismissed');
      
      if (!dismissed) { 
        setShowPrompt(true);
        setShowButton(true);
      }
    };

    const installedHandler = () => {
      console.log('✅ Delivery appinstalled event fired');
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
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt && !(window as any).deliveryDeferredPrompt) {
      console.log('⚠️ No install prompt available for Delivery PWA');
      
      // If iOS, show manual instructions
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
        setShowManualInstall(true);
      }
      return;
    }

    const promptEvent = deferredPrompt || (window as any).deliveryDeferredPrompt;

    try {
      if (promptEvent) {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log(`👤 User choice: ${outcome}`);

        if (outcome === 'accepted') {
          console.log('✅ User accepted the delivery PWA install');
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        (window as any).deliveryDeferredPrompt = null;
      }
      setShowPrompt(false);
      setShowButton(false);
    } catch (error) {
      console.error('❌ Error installing Delivery PWA:', error);
      setShowManualInstall(true);
    }
  };

  const handleDismiss = () => {
    console.log('👋 User dismissed delivery install prompt');
    localStorage.setItem('delivery-pwa-install-dismissed', new Date().toISOString());
    setShowPrompt(false);
    setShowButton(false);
  };

  // Don't show anything if installed
  if (isInstalled) {
    return null;
  }

  // Don't show if no prompt available and dismissed
  if (!showButton && !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <Card className="p-4 border-2 border-blue-500 shadow-xl bg-white dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl shrink-0">
            <Bike className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Install Delivery App</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Install the Delivery Partner app for quick access to orders and offline support!
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-bold">
                <Download className="w-4 h-4 mr-2" />
                Install Now
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="icon" className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showManualInstall} onOpenChange={setShowManualInstall}>
        <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Install Delivery App</DialogTitle>
            <DialogDescription>
              To install this app on your device, please follow these steps:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              {(typeof window !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document))) ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded shadow-sm">
                      <Share className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-sm">1. Tap the <span className="font-bold">Share</span> button.</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded shadow-sm">
                      <PlusSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <p className="text-sm">2. Tap <span className="font-bold">Add to Home Screen</span>.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded shadow-sm">
                      <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <p className="text-sm">1. Tap the <span className="font-bold">Browser Menu</span> (three dots).</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded shadow-sm">
                      <Download className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <p className="text-sm">2. Tap <span className="font-bold">Install App</span> or <span className="font-bold">Add to Home Screen</span>.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowManualInstall(false)} className="w-full bg-blue-600 hover:bg-blue-700">Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
