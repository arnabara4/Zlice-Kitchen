'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';

interface OrderNotificationOptions {
  canteenId: string | null;
  enabled?: boolean;
  volume?: number; // 0 to 1
}

const SOUND_ENABLED_KEY = 'orderNotificationSoundEnabled';

// Get initial value from localStorage (default to true)
function getStoredSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  // Default to true if not set
  return stored === null ? true : stored === 'true';
}

// Save to localStorage
function setSoundEnabledStorage(value: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SOUND_ENABLED_KEY, String(value));
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Custom hook for playing notification sounds when new orders arrive.
 * Uses Web Audio API to generate a loud ting-tong bell sound.
 * Also uses Speech Synthesis to announce "New Order Added".
 * Sound is enabled by default and persisted to localStorage.
 */
export function useOrderNotification({ canteenId, enabled = true, volume = 1.0 }: OrderNotificationOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const notifiedOrdersRef = useRef<Set<string>>(new Set());
  const [isSoundEnabled, setIsSoundEnabled] = useState(true); // Default true, will sync with localStorage
  const isSoundEnabledRef = useRef(true); // Ref to avoid stale closure
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const isInitialLoadRef = useRef(true); // Track if this is the first data load
  
  // Sync with localStorage on mount
  useEffect(() => {
    const storedValue = getStoredSoundEnabled();
    setIsSoundEnabled(storedValue);
    isSoundEnabledRef.current = storedValue;
  }, []);
  
  // Keep ref in sync with state and persist to localStorage
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
    setSoundEnabledStorage(isSoundEnabled);
  }, [isSoundEnabled]);
  
  // Initialize AudioContext
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  // Play loud ting-tong bell sound using Web Audio API
  const playTingTong = useCallback((ctx: AudioContext, startTime: number) => {
    // TING - High bell sound (loud)
    const tingFreq = 1400; // High frequency for "ting"
    const tingOsc = ctx.createOscillator();
    const tingGain = ctx.createGain();
    
    tingOsc.connect(tingGain);
    tingGain.connect(ctx.destination);
    
    tingOsc.type = 'sine';
    tingOsc.frequency.setValueAtTime(tingFreq, startTime);
    tingOsc.frequency.exponentialRampToValueAtTime(tingFreq * 0.8, startTime + 0.3);
    
    // Loud attack, gradual decay
    tingGain.gain.setValueAtTime(0, startTime);
    tingGain.gain.linearRampToValueAtTime(volume * 0.9, startTime + 0.01);
    tingGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
    
    tingOsc.start(startTime);
    tingOsc.stop(startTime + 0.6);
    
    // Add harmonic for richness
    const tingHarmonic = ctx.createOscillator();
    const tingHarmonicGain = ctx.createGain();
    tingHarmonic.connect(tingHarmonicGain);
    tingHarmonicGain.connect(ctx.destination);
    tingHarmonic.type = 'triangle';
    tingHarmonic.frequency.setValueAtTime(tingFreq * 2.5, startTime);
    tingHarmonicGain.gain.setValueAtTime(0, startTime);
    tingHarmonicGain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.01);
    tingHarmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
    tingHarmonic.start(startTime);
    tingHarmonic.stop(startTime + 0.5);
    
    // TONG - Lower bell sound (loud)
    const tongFreq = 880; // Lower frequency for "tong"
    const tongStart = startTime + 0.25;
    const tongOsc = ctx.createOscillator();
    const tongGain = ctx.createGain();
    
    tongOsc.connect(tongGain);
    tongGain.connect(ctx.destination);
    
    tongOsc.type = 'sine';
    tongOsc.frequency.setValueAtTime(tongFreq, tongStart);
    tongOsc.frequency.exponentialRampToValueAtTime(tongFreq * 0.7, tongStart + 0.5);
    
    // Loud and resonant
    tongGain.gain.setValueAtTime(0, tongStart);
    tongGain.gain.linearRampToValueAtTime(volume * 1.0, tongStart + 0.01);
    tongGain.gain.exponentialRampToValueAtTime(0.01, tongStart + 0.7);
    
    tongOsc.start(tongStart);
    tongOsc.stop(tongStart + 0.8);
    
    // Add deep harmonic for "tong"
    const tongHarmonic = ctx.createOscillator();
    const tongHarmonicGain = ctx.createGain();
    tongHarmonic.connect(tongHarmonicGain);
    tongHarmonicGain.connect(ctx.destination);
    tongHarmonic.type = 'triangle';
    tongHarmonic.frequency.setValueAtTime(tongFreq * 0.5, tongStart);
    tongHarmonicGain.gain.setValueAtTime(0, tongStart);
    tongHarmonicGain.gain.linearRampToValueAtTime(volume * 0.5, tongStart + 0.01);
    tongHarmonicGain.gain.exponentialRampToValueAtTime(0.001, tongStart + 0.6);
    tongHarmonic.start(tongStart);
    tongHarmonic.stop(tongStart + 0.7);
  }, [volume]);

  // Play notification with voice announcement + ting-tong
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = initAudioContext();
      if (!ctx) return;
      
      // First: Speak "New Order Added" using Speech Synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('New Order Added');
        utterance.rate = 1.1; // Slightly faster
        utterance.pitch = 1.0;
        utterance.volume = 1.0; // Maximum volume
        
        // Play ting-tong after speech ends
        utterance.onend = () => {
          const now = ctx.currentTime;
          playTingTong(ctx, now);
          // Play it twice for emphasis
          playTingTong(ctx, now + 0.8);
        };
        
        // Cancel any ongoing speech and speak
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: just play ting-tong if speech synthesis not available
        const now = ctx.currentTime;
        playTingTong(ctx, now);
        playTingTong(ctx, now + 0.8);
      }
      
      console.log('🔔 Notification sound played: "New Order Added" + Ting-Tong');
    } catch (err) {
      console.log('Audio play error:', err);
    }
  }, [initAudioContext, playTingTong]);

  // Subscribe to Push Notifications
  const subscribeToPush = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      // 1. Register Service Worker (if not already)
      // Note: app/layout.tsx already registers /sw.js, but we ensure it's ready here
      const registration = await navigator.serviceWorker.ready;

      // 2. Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      // SYNC: If subscription exists, ensure backend has it
      if (subscription) {
        // We don't return here, we proceed to send it to backend to "Heal" any missing DB record
        console.log('Existing subscription found, syncing with backend...');
      } else {
        // 3. If not, subscribe
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('VAPID Public Key not found');
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // 4. Send subscription to server
      if (subscription) {
        const res = await fetch('/api/web-push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });
        
        if (!res.ok) {
           const errorText = await res.text();
           console.error('Failed to save subscription:', errorText);
           alert(`DEBUG: Push Subscription FAILED to save! Server says: ${errorText}`);
        } else {
           console.log('Push subscription saved to server.');
           // Only alert once to avoid annoyance, or if requested for debugging
           // alert('DEBUG: Push Subscription Saved Successfully!'); 
        }
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  }, []);

  // Enable sound function
  const enableSound = useCallback(() => {
    initAudioContext();
    setIsSoundEnabled(true);
    isSoundEnabledRef.current = true;
    setHasUserInteracted(true);
    
    // Play test sound
    playNotificationSound();
    


    // Request browser notification permission for PWA
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
             subscribeToPush(); // Trigger actual VAPID subscription
             toast.success('Push notifications enabled!', {
               description: 'You will receive notifications even when the app is in background',
               duration: 3000,
             });
          }
        });
      } else if (Notification.permission === 'granted') {
         subscribeToPush(); // Ensure subscription is up to date
      }
    }
    
    toast.success('Sound notifications enabled!', {
      description: 'You will hear a chime when new orders arrive',
      duration: 3000,
    });
  }, [initAudioContext, playNotificationSound, subscribeToPush]);

  // Disable sound function
  const disableSound = useCallback(() => {
    setIsSoundEnabled(false);
    isSoundEnabledRef.current = false;
    
    toast.info('Sound notifications disabled', {
      description: 'You can re-enable them from settings',
      duration: 2000,
    });
  }, []);

  // Toggle sound function
  const toggleSound = useCallback(() => {
    if (isSoundEnabledRef.current) {
      disableSound();
    } else {
      enableSound();
    }
  }, [enableSound, disableSound]);

  // Handle new order notification
  const notifyNewOrder = useCallback((orderId: string, orderNumber?: string | number) => {
    if (!enabled) return;
    
    // Check if already notified
    if (notifiedOrdersRef.current.has(orderId)) {
      console.log('Order already notified:', orderId);
      return;
    }
    
    // Mark as notified
    notifiedOrdersRef.current.add(orderId);
    console.log('🍽️ New order detected:', orderId, orderNumber);
    
    // Keep the set from growing too large
    if (notifiedOrdersRef.current.size > 100) {
      const idsArray = Array.from(notifiedOrdersRef.current);
      notifiedOrdersRef.current = new Set(idsArray.slice(-50));
    }
    
    // Play sound if enabled (using ref to avoid stale closure)
    if (isSoundEnabledRef.current) {
      console.log('Playing notification sound for order:', orderNumber);
      playNotificationSound();
    } else {
      console.log('Sound not enabled, skipping sound for order:', orderNumber);
    }
    
    // Show toast notification using sonner's success variant
    toast.success('New Order #' + (orderNumber || 'NEW'), {
      description: 'A new order has been placed!',
      duration: 8000,
    });
    
    // Note: Browser/device notifications are now handled server-side via push notifications
    // This hook only handles in-app sound alerts and toast notifications
    // The server sends proper push notifications to all subscribed devices via sendOrderNotificationToCanteen
  }, [enabled, playNotificationSound]);


  // Check for new orders (used with polling)
  const checkForNewOrders = useCallback((orders: Array<{ id: string; order_number?: string | number }>) => {
    if (!enabled) return;
    
    // On first load, just record the current orders without notifying
    // This prevents notifications for orders that existed before the page loaded
    if (isInitialLoadRef.current) {
      console.log('Initial load - recording existing orders:', orders.length);
      orders.forEach(order => notifiedOrdersRef.current.add(order.id));
      isInitialLoadRef.current = false;
      return;
    }
    
    // Check for genuinely new orders (orders we haven't seen before)
    orders.forEach(order => {
      if (!notifiedOrdersRef.current.has(order.id)) {
        notifyNewOrder(order.id, order.order_number);
      }
    });
  }, [enabled, notifyNewOrder]);

  // Setup polling for new orders
  useEffect(() => {
    if (!canteenId || !enabled) return;
    
    let isMounted = true;
    
    const fetchLatestOrders = async () => {
      try {
        const resp = await fetch(`/api/orders/list?canteenId=${canteenId}`);
        if (!resp.ok) return;
        
        const orders = await resp.json();
        if (isMounted) {
            // Check for new orders
            orders.forEach((o: any) => {
               // Only care about genuinely new orders created very recently
               // to avoid notifying on full syncs
               const orderTime = new Date(o.created_at).getTime();
               const now = new Date().getTime();
               const isRecent = (now - orderTime) < 15000; // 15 seconds

               if (isRecent && !notifiedOrdersRef.current.has(o.id)) {
                  notifyNewOrder(o.id, o.order_number);
               }
            });
        }
      } catch (err) {
        // Silently fail polling
      }
    };

    // The component using this hook (order-builder or order-display) might already
    // be polling, but we keep a lightweight secondary poll here just for notifications
    const pollInterval = setInterval(fetchLatestOrders, 10000); 

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [canteenId, enabled, notifyNewOrder]);

  // Listen for user interaction to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        // Initialize audio context on first interaction
        initAudioContext();
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [hasUserInteracted, initAudioContext]);

  // Listen for settings changes from other components
  useEffect(() => {
    const handleSettingChange = (event: CustomEvent) => {
      const newValue = event.detail as boolean;
      setIsSoundEnabled(newValue);
      isSoundEnabledRef.current = newValue;
    };

    window.addEventListener('soundSettingChanged', handleSettingChange as EventListener);
    return () => {
      window.removeEventListener('soundSettingChanged', handleSettingChange as EventListener);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isSoundEnabled,
    hasUserInteracted,
    playNotificationSound,
    checkForNewOrders,
    enableSound,
    disableSound,
    toggleSound,
    notifyNewOrder,
  };
}

// Export a helper to get/set sound preference from settings page
export function getSoundEnabled(): boolean {
  return getStoredSoundEnabled();
}

export function setSoundEnabled(value: boolean): void {
  setSoundEnabledStorage(value);
  // Dispatch event so other components can listen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('soundSettingChanged', { detail: value }));
  }
}
