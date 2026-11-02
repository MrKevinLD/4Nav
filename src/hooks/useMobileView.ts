import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

export function useMobileView() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return window.innerWidth <= 840 || (isTouch && window.innerWidth <= 1024) || Boolean(window.Capacitor?.isNativePlatform?.());
  });

  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const checkState = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile = window.innerWidth <= 840 || (isTouch && window.innerWidth <= 1024) || Boolean(window.Capacitor?.isNativePlatform?.());
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
      setIsPortrait(portrait);
    };

    window.addEventListener('resize', checkState);
    window.addEventListener('orientationchange', checkState);
    return () => {
      window.removeEventListener('resize', checkState);
      window.removeEventListener('orientationchange', checkState);
    };
  }, []);

  return { isMobile, isPortrait };
}

