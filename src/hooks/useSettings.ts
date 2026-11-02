import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../types/browser.types';

const SETTINGS_STORAGE_KEY = 'quadnav_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  enableLiteMode: false,
  muteBackgroundPanes: true,
  limitBackgroundFramerate: true,
  defaultZoomLevel: 1,
  modifierKey: 'Alt',
  maximizeShortcuts: {
    1: 'Alt+1',
    2: 'Alt+2',
    3: 'Alt+3',
    4: 'Alt+4',
    5: 'Alt+5',
    6: 'Alt+6',
    7: 'Alt+7',
    8: 'Alt+8',
  },
  defaultNewPaneUrl: 'about:blank',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          maximizeShortcuts: {
            ...DEFAULT_SETTINGS.maximizeShortcuts,
            ...(parsed.maximizeShortcuts || {}),
          },
        };
      }
    } catch {
      // Ignore JSON error
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore localStorage errors
    }
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const setModifierKey = useCallback((modifier: 'Alt' | 'Ctrl' | 'Shift') => {
    setSettings((prev) => {
      const nextShortcuts: Record<number, string> = {};
      for (let i = 1; i <= 8; i++) {
        nextShortcuts[i] = `${modifier}+${i}`;
      }
      return {
        ...prev,
        modifierKey: modifier,
        maximizeShortcuts: nextShortcuts,
      };
    });
  }, []);

  const setShortcut = useCallback((windowIndex: number, shortcut: string) => {
    setSettings((prev) => ({
      ...prev,
      maximizeShortcuts: {
        ...prev.maximizeShortcuts,
        [windowIndex]: shortcut,
      },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    setModifierKey,
    setShortcut,
    resetSettings,
  };
}

