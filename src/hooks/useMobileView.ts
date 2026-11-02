import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useMobileView() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isNative = Capacitor.isNativePlatform();
    if (isNative) return true;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return window.innerWidth <= 840 || (isTouch && window.innerWidth <= 1024);
  });

  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const checkState = () => {
      const isNative = Capacitor.isNativePlatform();
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile = isNative || window.innerWidth <= 840 || (isTouch && window.innerWidth <= 1024);
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
