import { useState, useEffect, useCallback } from 'react';
import type { BrowserTab, PaneState } from '../types/browser.types';
import {
  getContainerColor,
  getDisplayHost,
  getPaneMeta,
  normalizeAddressInput,
} from '../utils/url.utils';

const STORAGE_KEY = 'quadnav_desktop_tabs_v3';
const ACTIVE_TAB_KEY = 'quadnav_active_tab_v3';

function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createInitialPane(
  id: string,
  index: number = 0,
  initialUrl: string = 'about:blank'
): PaneState {
  const meta = getPaneMeta(id, index);
  const normalized = initialUrl === 'about:blank' ? 'about:blank' : normalizeAddressInput(initialUrl);
  return {
    id,
    quadrantNumber: meta.number,
    positionLabel: meta.label,
    url: normalized,
    inputUrl: normalized === 'about:blank' ? '' : normalized,
    title: getDisplayHost(normalized),
    history: [normalized],
    historyIndex: 0,
    isLoading: normalized !== 'about:blank',
    reloadCounter: 0,
    useProxy: false,
    isolateSubPane: false,
    isMuted: false,
    zoomLevel: 1,
    frameBlockedReason: null,
  };
}

export function createBrowserTab(
  sessionNumber: number,
  initialUrls?: string[] | Record<string, string>,
  customTitle?: string
): BrowserTab {
  const tabId = generateUniqueId('tab');
  const sessionId = generateUniqueId(`session-${sessionNumber}`);

  let paneUrls: string[] = ['https://play.roclassicidle.com.br/'];
  if (Array.isArray(initialUrls) && initialUrls.length > 0) {
    paneUrls = initialUrls;
  } else if (initialUrls && typeof initialUrls === 'object') {
    const vals = Object.values(initialUrls).filter(Boolean);
    if (vals.length > 0) paneUrls = vals;
  }

  const paneOrder: string[] = [];
  const panes: Record<string, PaneState> = {};

  paneUrls.forEach((url, idx) => {
    const pId = `p${idx + 1}`;
    paneOrder.push(pId);
    panes[pId] = createInitialPane(pId, idx, url);
  });

  // Prepare Electron isolated partition if running inside Desktop runtime
  if (typeof window !== 'undefined' && window.electronAPI?.prepareSession) {
    window.electronAPI.prepareSession(`persist:${sessionId}`).catch(() => {});
  }

  return {
    id: tabId,
    title: customTitle || `Navegador #${sessionNumber}`,
    sessionNumber,
    sessionId,
    containerColor: getContainerColor(sessionNumber),
    paneOrder,
    panes,
    activePane: paneOrder[0] || 'p1',
    maximizedPane: null,
    splitX: 50,
    splitY: 50,
    createdAt: Date.now(),
  };
}

function getDefaultTabs(): BrowserTab[] {
  return [
    createBrowserTab(
      1,
      ['https://play.roclassicidle.com.br'],
      'Navegador #1'
    ),
  ];
}

export function useBrowserState() {
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as any[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((tab) => {
            let paneOrder = tab.paneOrder;
            if (!Array.isArray(paneOrder) || paneOrder.length === 0) {
              paneOrder = Object.keys(tab.panes || {});
              if (paneOrder.length === 0) paneOrder = ['p1'];
            }
            const panes: Record<string, PaneState> = { ...(tab.panes || {}) };
            paneOrder.forEach((pId: string, idx: number) => {
              if (!panes[pId]) {
                panes[pId] = createInitialPane(pId, idx, 'about:blank');
              }
            });
            return {
              ...tab,
              paneOrder,
              panes,
              activePane: tab.activePane && panes[tab.activePane] ? tab.activePane : paneOrder[0],
              maximizedPane: tab.maximizedPane && panes[tab.maximizedPane] ? tab.maximizedPane : null,
            } as BrowserTab;
          });
        }
      }
    } catch {
      // Fallback to default tabs
    }
    return getDefaultTabs();
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_TAB_KEY);
      if (savedId) return savedId;
    } catch {
      // Ignore
    }
    return '';
  });

  // Ensure activeTabId always points to an existing tab
  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (currentTab && currentTab.id !== activeTabId) {
      setActiveTabId(currentTab.id);
    }
  }, [currentTab, activeTabId]);

  // Persist tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
      if (currentTab) {
        localStorage.setItem(ACTIVE_TAB_KEY, currentTab.id);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [tabs, currentTab]);

  // Ensure Electron partitions are initialized on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.prepareSession) {
      tabs.forEach((tab) => {
        window.electronAPI?.prepareSession(`persist:${tab.sessionId}`).catch(() => {});
      });
    }
  }, [tabs]);

  /**
   * Opens a brand-new tab with its own isolated browser session (new cookie jar / login state)
   */
  const addTab = useCallback(
    (initialUrls?: string[] | Record<string, string>, customTitle?: string) => {
      setTabs((prev) => {
        const maxSessionNum = prev.reduce((max, t) => Math.max(max, t.sessionNumber), 0);
        const nextNum = maxSessionNum + 1;
        const newTab = createBrowserTab(nextNum, initialUrls, customTitle);
        setActiveTabId(newTab.id);
        return [...prev, newTab];
      });
    },
    []
  );

  /**
   * Clones all URLs of an existing tab into a BRAND NEW isolated session tab
   */
  const cloneTabIntoNewSession = useCallback((sourceTabId: string) => {
    setTabs((prev) => {
      const source = prev.find((t) => t.id === sourceTabId);
      if (!source) return prev;
      const maxSessionNum = prev.reduce((max, t) => Math.max(max, t.sessionNumber), 0);
      const nextNum = maxSessionNum + 1;
      const urls = source.paneOrder.map((pId) => source.panes[pId]?.url || 'about:blank');
      const newTab = createBrowserTab(nextNum, urls, `Navegador #${nextNum}`);
      setActiveTabId(newTab.id);
      return [...prev, newTab];
    });
  }, []);

  /**
   * Closes a tab and cleans up its session if needed. Never leaves 0 tabs.
   */
  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const target = prev.find((t) => t.id === tabId);
        if (target) {
          if (window.electronAPI?.clearSession) {
            window.electronAPI.clearSession(`persist:${target.sessionId}`).catch(() => {});
          }
          fetch(`/api/clear-session?session=${encodeURIComponent(target.sessionId)}`).catch(
            () => {}
          );
        }

        if (prev.length <= 1) {
          const fresh = createBrowserTab(1);
          setActiveTabId(fresh.id);
          return [fresh];
        }

        const idx = prev.findIndex((t) => t.id === tabId);
        const filtered = prev.filter((t) => t.id !== tabId);
        if (tabId === activeTabId) {
          const nextTab = filtered[Math.max(0, idx - 1)] || filtered[0];
          if (nextTab) setActiveTabId(nextTab.id);
        }
        return filtered;
      });
    },
    [activeTabId]
  );

  /**
   * Resets/clears all cookies, localStorage, and login sessions for a specific tab
   */
  const resetTabSession = useCallback((tabId: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;

        const oldSessionId = tab.sessionId;
        if (window.electronAPI?.clearSession) {
          window.electronAPI.clearSession(`persist:${oldSessionId}`).catch(() => {});
        }
        fetch(`/api/clear-session?session=${encodeURIComponent(oldSessionId)}`).catch(() => {});

        const freshSessionId = generateUniqueId(`session-${tab.sessionNumber}`);
        if (window.electronAPI?.prepareSession) {
          window.electronAPI.prepareSession(`persist:${freshSessionId}`).catch(() => {});
        }

        const updatedPanes: Record<string, PaneState> = {};
        tab.paneOrder.forEach((pId) => {
          const existing = tab.panes[pId];
          if (existing) {
            updatedPanes[pId] = {
              ...existing,
              reloadCounter: existing.reloadCounter + 1,
            };
          }
        });

        return {
          ...tab,
          sessionId: freshSessionId,
          panes: updatedPanes,
        };
      })
    );
  }, []);

  const renameTab = useCallback((tabId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, title: trimmed } : t)));
  }, []);

  /**
   * Adds a new window/pane to the specified tab
   */
  const addPane = useCallback((tabId: string, initialUrl: string = 'about:blank') => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        let nextIndex = tab.paneOrder.length + 1;
        let nextId = `p${nextIndex}`;
        while (tab.panes[nextId]) {
          nextIndex++;
          nextId = `p${nextIndex}`;
        }
        const newPane = createInitialPane(nextId, tab.paneOrder.length, initialUrl);
        return {
          ...tab,
          paneOrder: [...tab.paneOrder, nextId],
          panes: {
            ...tab.panes,
            [nextId]: newPane,
          },
          activePane: nextId,
        };
      })
    );
  }, []);

  /**
   * Removes a window/pane from the specified tab (if > 1 window exists)
   */
  const removePane = useCallback((tabId: string, paneId: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        if (tab.paneOrder.length <= 1) return tab;

        const nextPaneOrder = tab.paneOrder.filter((id) => id !== paneId);
        const nextPanes = { ...tab.panes };
        delete nextPanes[paneId];

        const nextActivePane =
          tab.activePane === paneId ? nextPaneOrder[0] || '' : tab.activePane;

        const nextMaximizedPane =
          tab.maximizedPane === paneId ? null : tab.maximizedPane;

        return {
          ...tab,
          paneOrder: nextPaneOrder,
          panes: nextPanes,
          activePane: nextActivePane,
          maximizedPane: nextMaximizedPane,
        };
      })
    );
  }, []);

  /**
   * Updates a specific quadrant/pane inside the active tab
   */
  const updatePane = useCallback(
    (tabId: string, paneId: string, updater: (pane: PaneState) => PaneState) => {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== tabId || !tab.panes[paneId]) return tab;
          const updatedPane = updater(tab.panes[paneId]);
          return {
            ...tab,
            panes: {
              ...tab.panes,
              [paneId]: updatedPane,
            },
          };
        })
      );
    },
    []
  );

  /**
   * Navigates a specific pane to a new URL or search term
   */
  const navigatePane = useCallback(
    (tabId: string, paneId: string, rawInput: string) => {
      const targetUrl = normalizeAddressInput(rawInput);
      updatePane(tabId, paneId, (pane) => {
        const truncatedHistory = pane.history.slice(0, pane.historyIndex + 1);
        const lastUrl = truncatedHistory[truncatedHistory.length - 1];
        const nextHistory =
          lastUrl === targetUrl ? truncatedHistory : [...truncatedHistory, targetUrl];
        const nextIndex = nextHistory.length - 1;

        return {
          ...pane,
          url: targetUrl,
          inputUrl: targetUrl === 'about:blank' ? '' : targetUrl,
          title: getDisplayHost(targetUrl),
          history: nextHistory,
          historyIndex: nextIndex,
          isLoading: targetUrl !== 'about:blank',
          frameBlockedReason: null,
        };
      });
    },
    [updatePane]
  );

  const goBackPane = useCallback(
    (tabId: string, paneId: string) => {
      updatePane(tabId, paneId, (pane) => {
        if (pane.historyIndex <= 0) return pane;
        const nextIndex = pane.historyIndex - 1;
        const targetUrl = pane.history[nextIndex];
        return {
          ...pane,
          url: targetUrl,
          inputUrl: targetUrl === 'about:blank' ? '' : targetUrl,
          title: getDisplayHost(targetUrl),
          historyIndex: nextIndex,
          isLoading: targetUrl !== 'about:blank',
          frameBlockedReason: null,
        };
      });
    },
    [updatePane]
  );

  const goForwardPane = useCallback(
    (tabId: string, paneId: string) => {
      updatePane(tabId, paneId, (pane) => {
        if (pane.historyIndex >= pane.history.length - 1) return pane;
        const nextIndex = pane.historyIndex + 1;
        const targetUrl = pane.history[nextIndex];
        return {
          ...pane,
          url: targetUrl,
          inputUrl: targetUrl === 'about:blank' ? '' : targetUrl,
          title: getDisplayHost(targetUrl),
          historyIndex: nextIndex,
          isLoading: targetUrl !== 'about:blank',
          frameBlockedReason: null,
        };
      });
    },
    [updatePane]
  );

  const reloadPane = useCallback(
    (tabId: string, paneId: string) => {
      updatePane(tabId, paneId, (pane) => ({
        ...pane,
        reloadCounter: pane.reloadCounter + 1,
        isLoading: pane.url !== 'about:blank',
        frameBlockedReason: null,
      }));
    },
    [updatePane]
  );

  const setActivePane = useCallback((tabId: string, paneId: string) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, activePane: paneId } : tab))
    );
  }, []);

  const toggleMaximizePane = useCallback((tabId: string, paneId: string) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== tabId) return tab;
        return {
          ...tab,
          activePane: paneId,
          maximizedPane: tab.maximizedPane === paneId ? null : paneId,
        };
      })
    );
  }, []);

  const updateGridSplit = useCallback((tabId: string, splitX: number, splitY: number) => {
    const clampedX = Math.min(82, Math.max(18, splitX));
    const clampedY = Math.min(82, Math.max(18, splitY));
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId ? { ...tab, splitX: clampedX, splitY: clampedY } : tab
      )
    );
  }, []);

  const applyPresetToTab = useCallback(
    (tabId: string, presetUrls: Record<string, string>) => {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== tabId) return tab;
          const entries = Object.entries(presetUrls);
          const newPaneOrder: string[] = [];
          const newPanes: Record<string, PaneState> = {};
          entries.forEach(([_key, url], idx) => {
            const pId = `p${idx + 1}`;
            newPaneOrder.push(pId);
            newPanes[pId] = createInitialPane(pId, idx, url);
          });
          return {
            ...tab,
            paneOrder: newPaneOrder,
            panes: newPanes,
            activePane: newPaneOrder[0] || 'p1',
            maximizedPane: null,
          };
        })
      );
    },
    []
  );

  return {
    tabs,
    currentTab,
    activeTabId: currentTab?.id || '',
    setActiveTabId,
    addTab,
    cloneTabIntoNewSession,
    closeTab,
    resetTabSession,
    renameTab,
    addPane,
    removePane,
    updatePane,
    navigatePane,
    goBackPane,
    goForwardPane,
    reloadPane,
    setActivePane,
    toggleMaximizePane,
    updateGridSplit,
    applyPresetToTab,
  };
}
