'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes warning

interface UseSessionTimeoutReturn {
  showWarning: boolean;
  remainingTime: number;
  extendSession: () => void;
}

export function useSessionTimeout(onLogout: () => void): UseSessionTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_BEFORE / 1000);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      onLogout();
    }, INACTIVITY_TIMEOUT);
  }, [clearAllTimers, onLogout]);

  useEffect(() => {
    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    const initTimer = setTimeout(() => {
      resetTimer();
    }, 0);

    return () => {
      clearTimeout(initTimer);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [resetTimer, clearAllTimers, showWarning]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return { showWarning, remainingTime, extendSession };
}
