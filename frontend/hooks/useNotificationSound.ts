'use client';

import { useCallback, useRef, useEffect } from 'react';

const STORAGE_KEY = 'livechat_sound_enabled';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    enabledRef.current = stored !== 'false';
  }, []);

  const playNotification = useCallback(() => {
    if (!enabledRef.current || typeof window === 'undefined') return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      // Use Web Audio API for a simple beep if no audio file
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gain.gain.value = 0.3;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not supported or blocked by browser
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);

  return { playNotification, setEnabled, isEnabled };
}
