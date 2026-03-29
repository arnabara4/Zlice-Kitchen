'use client';

/**
 * NotificationSoundProvider - Client Component
 * 
 * This component initializes the notification sound system on the client side.
 * It MUST be a client component ('use client') because:
 * 1. It needs access to browser APIs (Audio, ServiceWorker)
 * 2. It needs to run in the browser, not on the server
 * 
 * Include this component in your layout to enable notification sounds.
 */

import { useEffect, useRef } from 'react';

// Sound configuration
const SOUND_MAP: Record<string, string> = {
  'canteen-order': '/dragon-studio-notification-sound-effect-372475.mp3',
  'new-order': '/dragon-studio-notification-sound-effect-372475.mp3',
  'delivery-order': '/notification.mp3',
  'delivery-ready': '/notification.mp3',
  'default': '/dragon-studio-notification-sound-effect-372475.mp3',
};

const DEFAULT_SOUND_URL = '/dragon-studio-notification-sound-effect-372475.mp3';

export function NotificationSoundProvider() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isUnlockedRef = useRef(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('[Sound] Initializing notification sound provider...');

    // Create audio element
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = 1.0;
    audioRef.current = audio;

    // Function to unlock audio on user interaction
    const unlockAudio = () => {
      if (isUnlockedRef.current) return;

      console.log('[Sound] User interaction detected, unlocking audio...');

      // Try to play silently to unlock
      audio.src = DEFAULT_SOUND_URL;
      audio.volume = 0;
      audio.currentTime = 0;

      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1.0;
          isUnlockedRef.current = true;
          console.log('[Sound] ✅ Audio UNLOCKED successfully!');
          
          // Remove event listeners after unlock
          document.removeEventListener('click', unlockAudio, true);
          document.removeEventListener('touchstart', unlockAudio, true);
          document.removeEventListener('keydown', unlockAudio, true);
        })
        .catch((err) => {
          console.warn('[Sound] Could not unlock audio:', err.message);
        });
    };

    // Add unlock listeners
    document.addEventListener('click', unlockAudio, true);
    document.addEventListener('touchstart', unlockAudio, true);
    document.addEventListener('keydown', unlockAudio, true);
    console.log('[Sound] Waiting for user interaction to unlock audio...');

    // Function to play sound
    const playSound = (soundUrl: string) => {
      console.log('[Sound] Playing:', soundUrl, '| Unlocked:', isUnlockedRef.current);

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.volume = 1.0;
      }

      audioRef.current.src = soundUrl;
      audioRef.current.currentTime = 0;

      audioRef.current.play()
        .then(() => {
          console.log('[Sound] ✅ Sound played successfully!');
        })
        .catch((err) => {
          console.warn('[Sound] ❌ Playback blocked:', err.message);
        });
    };

    // Get sound URL from type
    const getSoundUrl = (soundType?: string): string => {
      if (!soundType) return DEFAULT_SOUND_URL;
      if (soundType.startsWith('/')) return soundType; // Already a URL
      return SOUND_MAP[soundType] || DEFAULT_SOUND_URL;
    };

    // Listen for messages from service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!event.data) return;

      console.log('[Sound] Message from service worker:', event.data);

      if (event.data.type === 'PLAY_NOTIFICATION_SOUND') {
        const soundUrl = event.data.soundUrl || getSoundUrl(event.data.sound);
        playSound(soundUrl);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      console.log('[Sound] ✅ Service worker message listener registered');
    } else {
      console.warn('[Sound] Service Worker not supported in this browser');
    }

    // Cleanup
    return () => {
      document.removeEventListener('click', unlockAudio, true);
      document.removeEventListener('touchstart', unlockAudio, true);
      document.removeEventListener('keydown', unlockAudio, true);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

// Also export as default for easier importing
export default NotificationSoundProvider;
