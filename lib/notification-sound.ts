/**
 * Production-Grade Notification Sound Player
 * 
 * Handles push notification sounds with full autoplay policy compliance.
 * Supports role-based sounds (canteen/delivery) and graceful fallback.
 * 
 * @module lib/notification-sound
 * 
 * BROWSER LIMITATIONS:
 * - Sound ONLY plays when PWA has an active window AND user has interacted
 * - iOS Safari/PWA: Sound not supported due to strict autoplay restrictions
 * - Background/closed app: No sound (no active window client)
 * - Device on silent/DND: System may mute sounds
 * 
 * USAGE:
 * ```typescript
 * // Auto-initialized on import - just import in layout.tsx
 * import '@/lib/notification-sound';
 * 
 * // Optional: manually unlock audio (called automatically on interaction)
 * import { enableNotificationSound } from '@/lib/notification-sound';
 * enableNotificationSound();
 * ```
 */

// ============================================================================
// SOUND CONFIGURATION
// ============================================================================

/**
 * Sound type to URL mapping for role-based notifications
 * Add new sound types here as needed
 */
const SOUND_MAP: Record<string, string> = {
  // Canteen/Seller sounds
  'canteen-order': '/nyo_nyo_nyo_nyoooo.mp3',
  'new-order': '/nyo_nyo_nyo_nyoooo.mp3',
  
  // Delivery/Buyer sounds  
  'delivery-order': '/notification.mp3',
  'delivery-ready': '/notification.mp3',
  
  // Fallback
  'default': '/notification.mp3',
};

/**
 * Default sound when no type specified or type not found
 */
const DEFAULT_SOUND_URL = '/nyo_nyo_nyo_nyoooo.mp3';

// ============================================================================
// NOTIFICATION SOUND PLAYER CLASS
// ============================================================================

class NotificationSoundPlayer {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  /**
   * Initialize the sound player:
   * 1. Register service worker message listener
   * 2. Setup auto-unlock on user interaction
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      console.log('[Sound] Service worker message listener registered');
    }

    // Auto-unlock on any user interaction
    // Using capture phase (true) to catch events early
    const unlockEvents = ['click', 'touchstart', 'keydown'];
    const autoUnlock = (): void => {
      if (!this.isUnlocked) {
        this.enableSound();
        // Remove listeners after first interaction to avoid overhead
        unlockEvents.forEach(event => {
          document.removeEventListener(event, autoUnlock, true);
        });
      }
    };
    
    unlockEvents.forEach(event => {
      document.addEventListener(event, autoUnlock, true);
    });

    this.isInitialized = true;
    console.log('[Sound] Notification sound player initialized');
  }

  /**
   * Handle incoming messages from service worker
   * @param event - MessageEvent from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    if (!event.data) return;

    console.log('[Sound] Received message from service worker:', event.data);

    if (event.data.type === 'PLAY_NOTIFICATION_SOUND') {
      // Get sound URL from:
      // 1. Direct soundUrl in message
      // 2. Sound type mapped to URL
      // 3. Default sound
      const soundUrl = event.data.soundUrl 
        || this.getSoundUrl(event.data.sound)
        || DEFAULT_SOUND_URL;
      
      this.play(soundUrl);
    }
  }

  // --------------------------------------------------------------------------
  // AUDIO UNLOCK (Autoplay Policy Compliance)
  // --------------------------------------------------------------------------

  /**
   * Enable sound playback by "unlocking" audio
   * 
   * CRITICAL: Must be called from a user gesture (click/touch/keydown)
   * This creates and resumes AudioContext + plays silent audio to unlock
   * 
   * @returns boolean - true if unlock was successful
   */
  enableSound(): boolean {
    if (this.isUnlocked) {
      console.log('[Sound] Already unlocked');
      return true;
    }

    try {
      console.log('[Sound] Enabling sound (user interaction detected)');
      
      // Create and resume AudioContext (required for Web Audio API fallback)
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();
        }
      }
      
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('[Sound] Could not resume AudioContext:', err);
        });
      }
      
      // Pre-create and "unlock" HTMLAudioElement by playing silently
      if (!this.audio) {
        this.audio = new Audio();
        this.audio.volume = 1.0;
        this.audio.preload = 'auto';
      }
      
      // Set a valid source and attempt silent play
      this.audio.src = DEFAULT_SOUND_URL;
      this.audio.volume = 0; // Silent
      this.audio.currentTime = 0;
      
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Successfully played - immediately pause and restore volume
            this.audio!.pause();
            this.audio!.currentTime = 0;
            this.audio!.volume = 1.0;
            this.isUnlocked = true;
            console.log('[Sound] Audio unlocked successfully!');
          })
          .catch((error) => {
            // Still mark as attempted - may work on next interaction
            console.warn('[Sound] Could not unlock audio:', error.message);
          });
      }
      
      return true;
    } catch (error) {
      console.error('[Sound] Error enabling sound:', error);
      return false;
    }
  }

  /**
   * Check if audio is unlocked and ready to play
   */
  isEnabled(): boolean {
    return this.isUnlocked;
  }

  // --------------------------------------------------------------------------
  // SOUND PLAYBACK
  // --------------------------------------------------------------------------

  /**
   * Get sound URL from sound type
   * @param soundType - Sound type key (e.g., 'canteen-order', 'delivery-order')
   * @returns Sound URL or undefined if not found
   */
  private getSoundUrl(soundType?: string): string | undefined {
    if (!soundType) return undefined;
    return SOUND_MAP[soundType];
  }

  /**
   * Play notification sound
   * 
   * @param soundUrlOrType - Either a direct URL or a sound type key
   * 
   * IMPORTANT: This will fail silently if audio is not unlocked
   * (browser autoplay policy). Check console for warnings.
   */
  play(soundUrlOrType: string = DEFAULT_SOUND_URL): void {
    try {
      // Resolve sound type to URL if needed
      const soundUrl = soundUrlOrType.startsWith('/') 
        ? soundUrlOrType 
        : (this.getSoundUrl(soundUrlOrType) || DEFAULT_SOUND_URL);
      
      console.log('[Sound] Playing sound:', soundUrl, '| Unlocked:', this.isUnlocked);
      
      // Create or reuse audio element
      if (!this.audio) {
        this.audio = new Audio(soundUrl);
        this.audio.volume = 1.0;
      } else {
        this.audio.src = soundUrl;
      }
      
      this.audio.currentTime = 0;

      // Attempt playback
      const playPromise = this.audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[Sound] Notification sound played successfully');
          })
          .catch((error) => {
            // Graceful failure - log warning, don't throw
            console.warn('[Sound] Playback blocked by browser:', error.message);
            console.warn('[Sound] User interaction required. Sound will play after next click.');
            
            // Try Web Audio API fallback beep
            this.playFallbackBeep();
          });
      }
    } catch (error) {
      console.error('[Sound] Error playing notification sound:', error);
      this.playFallbackBeep();
    }
  }

  /**
   * Play a fallback beep using Web Audio API
   * This may also fail if AudioContext is not unlocked
   */
  private playFallbackBeep(): void {
    try {
      if (typeof window === 'undefined') return;
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        this.audioContext = new AudioContextClass();
      }
      
      // Cannot play if suspended
      if (this.audioContext.state === 'suspended') {
        console.warn('[Sound] AudioContext suspended, cannot play fallback beep');
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure beep tone
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';
      
      // Envelope for smooth attack/decay
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      oscillator.start(now);
      oscillator.stop(now + 0.5);

      console.log('[Sound] Fallback beep played');
    } catch (error) {
      // Final fallback - complete silence
      console.warn('[Sound] Could not play fallback beep:', error);
    }
  }

  /**
   * Test sound playback (for debugging)
   * Should be called from a click handler
   */
  test(): void {
    this.enableSound();
    this.play(DEFAULT_SOUND_URL);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/** Singleton instance */
export const notificationSoundPlayer = new NotificationSoundPlayer();

/**
 * Play a notification sound
 * @param soundUrlOrType - Sound URL or type key
 */
export function playNotificationSound(soundUrlOrType?: string): void {
  notificationSoundPlayer.play(soundUrlOrType);
}

/**
 * Enable notification sounds (unlock audio)
 * Should be called from user interaction handler
 */
export function enableNotificationSound(): boolean {
  return notificationSoundPlayer.enableSound();
}

/**
 * Check if notification sounds are enabled
 */
export function isNotificationSoundEnabled(): boolean {
  return notificationSoundPlayer.isEnabled();
}

// Auto-log initialization
if (typeof window !== 'undefined') {
  console.log('[Sound] Module loaded');
}
