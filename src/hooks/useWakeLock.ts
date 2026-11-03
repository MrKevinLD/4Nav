import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    AndroidBridge?: {
      setKeepScreenOn: (keepOn: boolean) => void;
      clearMemoryCache: () => void;
    };
  }
}

export function useWakeLock(enabled: boolean) {
  const [isActive, setIsActive] = useState(false);
  const wakeLockSentinelRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    // 1. Native Android Bridge
    if (typeof window !== 'undefined' && window.AndroidBridge?.setKeepScreenOn) {
      try {
        window.AndroidBridge.setKeepScreenOn(true);
        setIsActive(true);
      } catch (err) {
        console.warn('[WakeLock] AndroidBridge error:', err);
      }
    }

    // 2. Web Screen Wake Lock API
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const sentinel = await (navigator as any).wakeLock.request('screen');
        sentinel.addEventListener('release', () => {
          setIsActive(false);
        });
        wakeLockSentinelRef.current = sentinel;
        setIsActive(true);
      } catch (err) {
        console.warn('[WakeLock] Web WakeLock API error:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    // 1. Native Android Bridge
    if (typeof window !== 'undefined' && window.AndroidBridge?.setKeepScreenOn) {
      try {
        window.AndroidBridge.setKeepScreenOn(false);
      } catch (err) {}
    }

    // 2. Web Screen Wake Lock API
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
      } catch (err) {}
      wakeLockSentinelRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [enabled, requestWakeLock, releaseWakeLock]);

  return { isActive, requestWakeLock, releaseWakeLock };
}

