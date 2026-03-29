"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, X, Smartphone, Share, Menu, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    console.log('🔧 PWA Install Prompt: Initializing...');
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isStandalone || isInStandaloneMode) {
      console.log('✅ PWA already installed');
      setIsInstalled(true);
      return;
    }

    // Check for existing deferred prompt (if event fired before React mounted)
    if ((window as any).deferredPrompt) {
        console.log('Found existing deferred prompt');
        setDeferredPrompt((window as any).deferredPrompt);
        
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
          setShowButton(true);
        }
    }

    // Check for deferred prompt every 1s for 5s (in case of race conditions)
    const checkInterval = setInterval(() => {
        if ((window as any).deferredPrompt) {
            console.log('Found deferred prompt via interval');
            setDeferredPrompt((window as any).deferredPrompt);
            
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
              setShowPrompt(true);
              setShowButton(true);
            }
            clearInterval(checkInterval);
        }
    }, 1000);

    const checkTimeout = setTimeout(() => clearInterval(checkInterval), 5000);

    // Show button immediately for iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
      if (!isInstalled) {
         const dismissed = localStorage.getItem('pwa-install-dismissed');
         if (!dismissed) {
            setShowButton(true);
         }
      }
    }

    // Listen for install prompt event
    const handler = (e: Event) => {
      console.log('🎯 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredPrompt = e;
      


      // Check if user has dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      
      if (!dismissed) { 
        setShowPrompt(true);
        setShowButton(true);
      }
    };

    const installedHandler = () => {
        console.log('✅ appinstalled event fired');
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
  }, [isInstalled, deferredPrompt]);

  const [showManualInstall, setShowManualInstall] = useState(false);



  const handleInstall = async () => {
    if (!deferredPrompt && !(window as any).deferredPrompt) {
      console.log('⚠️ No install prompt available');
      
      // If iOS, show manual instructions (since it doesn't support beforeinstallprompt)
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
         setShowManualInstall(true);
      }
      return;
    }

    const promptEvent = deferredPrompt || (window as any).deferredPrompt;

    try {
      if (promptEvent) {
          promptEvent.prompt();
          const { outcome } = await promptEvent.userChoice;
          console.log(`👤 User choice: ${outcome}`);

          if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            setIsInstalled(true);
          }
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
      }
      setShowPrompt(false);
      setShowButton(false);
    } catch (error) {
      console.error('❌ Error installing PWA:', error);
      setShowManualInstall(true);
    }
  };

  const handleDismiss = () => {
    console.log('👋 User dismissed install prompt');
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowPrompt(false);
    setShowButton(false);
  };

  if (isInstalled) {
    return null;
  }

  if (!showButton && !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <Card className="p-4 border-2 border-red-500 shadow-xl bg-white dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-xl shrink-0">
             <Smartphone className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Install App</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Install our app for a better experience, offline access, and faster loading!
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} className="flex-1 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600 font-bold">
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
            <DialogTitle>Install App</DialogTitle>
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
            <Button onClick={() => setShowManualInstall(false)} className="w-full">Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
