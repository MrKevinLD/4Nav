import { useState, useEffect } from 'react';

export interface BatteryInfo {
  supported: boolean;
  level: number;
  charging: boolean;
}

export function useDeviceBattery(): BatteryInfo {
  const [battery, setBattery] = useState<BatteryInfo>({
    supported: false,
    level: 100,
    charging: false,
  });

  useEffect(() => {
    let batteryObj: any = null;
    let updateFn: (() => void) | null = null;

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryObj = b;
        updateFn = () => {
          setBattery({
            supported: true,
            level: Math.round(b.level * 100),
            charging: b.charging,
          });
        };
        updateFn();
        b.addEventListener('levelchange', updateFn);
        b.addEventListener('chargingchange', updateFn);
      }).catch(() => {});
    }

    return () => {
      if (batteryObj && updateFn) {
        try {
          batteryObj.removeEventListener('levelchange', updateFn);
          batteryObj.removeEventListener('chargingchange', updateFn);
        } catch (_) {}
      }
    };
  }, []);

  return battery;
}
