import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { useBrowserState } from './hooks/useBrowserState';
import { useSettings } from './hooks/useSettings';
import { useMobileView } from './hooks/useMobileView';
import { useWakeLock } from './hooks/useWakeLock';
import { TabBar } from './components/TabBar';
import { QuadGrid } from './components/QuadGrid';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const {
    tabs,
    currentTab,
    activeTabId,
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
  } = useBrowserState();

  const {
    settings,
    updateSetting,
    setModifierKey,
    setShortcut,
    resetSettings,
  } = useSettings();

  const { isMobile, isPortrait } = useMobileView();
  const [isDualSplit, setIsDualSplit] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const edgeTouchStartY = useRef<number | null>(null);

  const handleEdgeTouchStart = (e: React.TouchEvent) => {
    edgeTouchStartY.current = e.touches[0].clientY;
  };

  const handleEdgeTouchEnd = (e: React.TouchEvent) => {
    if (edgeTouchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - edgeTouchStartY.current;
      if (deltaY > 15) {
        setIsImmersiveMode(false);
      }
      edgeTouchStartY.current = null;
    }
  };

  // Keep screen awake while 4Nav is active (configurable for idle gaming)
  useWakeLock(settings.keepScreenAwake);

  // Unregister any rogue Service Worker so native OkHttp interceptor handles all frame requests
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  // Global keyboard shortcuts (Ctrl+T, Ctrl+W, Escape, and Configurable Window Maximization Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape restores grid if a pane is currently maximized
      if (e.key === 'Escape' && currentTab?.maximizedPane) {
        e.preventDefault();
        toggleMaximizePane(currentTab.id, currentTab.maximizedPane);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        addTab();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        if (tabs.length > 1 && currentTab) {
          e.preventDefault();
          closeTab(currentTab.id);
          return;
        }
      }

      // Check maximize shortcuts for individual windows (e.g., Alt+1, Alt+2...)
      if (currentTab && currentTab.paneOrder) {
        for (const [winIdxStr, shortcutStr] of Object.entries(settings.maximizeShortcuts)) {
          const winIdx = Number(winIdxStr);
          if (!shortcutStr) continue;

          const parts = shortcutStr.split('+').map((p) => p.trim().toUpperCase());
          const expectedKey = parts[parts.length - 1];
          const reqAlt = parts.includes('ALT');
          const reqCtrl = parts.includes('CTRL');
          const reqShift = parts.includes('SHIFT');

          const pressedKey = e.key.toUpperCase();
          const altMatch = Boolean(e.altKey) === reqAlt;
          const ctrlMatch = Boolean(e.ctrlKey || e.metaKey) === reqCtrl;
          const shiftMatch = Boolean(e.shiftKey) === reqShift;
          const keyMatch = pressedKey === expectedKey;

          if (altMatch && ctrlMatch && shiftMatch && keyMatch) {
            e.preventDefault();
            const targetPaneId = currentTab.paneOrder[winIdx - 1];
            if (targetPaneId) {
              toggleMaximizePane(currentTab.id, targetPaneId);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addTab, closeTab, currentTab, tabs.length, settings.maximizeShortcuts, toggleMaximizePane]);

  const handleClearRamCache = useCallback(async () => {
    // 1. Android Native WebView Cache & GC
    if (typeof window !== 'undefined' && window.AndroidBridge?.clearMemoryCache) {
      try {
        window.AndroidBridge.clearMemoryCache();
      } catch {}
    }

    // 2. Electron Desktop Session Cache
    if (typeof window !== 'undefined' && window.electronAPI?.clearSession) {
      for (const tab of tabs) {
        await window.electronAPI.clearSession(`persist:${tab.sessionId}`).catch(() => {});
      }
    }
  }, [tabs]);

  if (!currentTab) return null;

  const showMobileBottomBar = isMobile && isPortrait;
  const currentPaneIds =
    currentTab.paneOrder && currentTab.paneOrder.length > 0
      ? currentTab.paneOrder
      : Object.keys(currentTab.panes);

  return (
    <div
      className={`w-screen h-[100dvh] bg-[#090A0C] text-[#F3F4F6] flex flex-col overflow-hidden relative ${
        settings.enableEcoBatteryMode ? 'mobile-eco-mode' : ''
      }`}
    >
      {/* Immersive Mode Floating Control Bar with Fast Maximizers */}
      {isImmersiveMode && (
        <div
          onTouchStart={handleEdgeTouchStart}
          onTouchEnd={handleEdgeTouchEnd}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2.5 py-1 bg-[#090A0C]/90 hover:bg-[#111317] border-b border-x border-[#3B82F6]/50 rounded-b-md shadow-2xl backdrop-blur select-none transition-all"
        >
          {/* Quick Maximizers for Each Window */}
          {currentPaneIds.length > 1 && (
            <div className="flex items-center gap-1 pr-1.5 border-r border-[#232832]">
              {currentPaneIds.map((paneId, idx) => {
                const paneNum = idx + 1;
                const isMax = currentTab.maximizedPane === paneId;
                return (
                  <button
                    key={paneId}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMaximizePane(currentTab.id, paneId);
                    }}
                    title={isMax ? `Restaurar Janela ${paneNum} (Divisão)` : `Maximizar Janela ${paneNum}`}
                    aria-label={`Maximizar Janela ${paneNum}`}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-[2px] transition-all cursor-pointer flex items-center gap-1 ${
                      isMax
                        ? 'bg-[#3B82F6] text-[#090A0C] shadow-sm'
                        : 'bg-[#181B21] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] border border-[#232832]'
                    }`}
                  >
                    <span>J{paneNum}</span>
                    {isMax && <span className="text-[9px]">⛶</span>}
                  </button>
                );
              })}

              {/* Quick Restore to Split View when a pane is maximized */}
              {currentTab.maximizedPane && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMaximizePane(currentTab.id, currentTab.maximizedPane!);
                  }}
                  title="Restaurar divisão de janelas"
                  aria-label="Restaurar divisão"
                  className="px-2 py-0.5 bg-[#181B21] hover:bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/40 rounded-[2px] text-[10px] font-mono font-bold transition-all cursor-pointer"
                >
                  Dividir
                </button>
              )}
            </div>
          )}

          {/* Restore All Bars Button */}
          <button
            type="button"
            onClick={() => setIsImmersiveMode(false)}
            title="Toque para restaurar todas as barras (ou deslize para baixo)"
            aria-label="Mostrar barras de navegação"
            className="flex items-center gap-1 pl-1 text-[#3B82F6] text-[10px] font-mono font-bold cursor-pointer group hover:text-[#60A5FA] transition-colors"
          >
            <CaretDown size={12} weight="bold" className="group-hover:translate-y-0.5 transition-transform" />
            <span className="text-[9px] tracking-wider uppercase">Barras</span>
          </button>
        </div>
      )}

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        splitX={currentTab.splitX}
        splitY={currentTab.splitY}
        maximizedPane={currentTab.maximizedPane}
        isVisible={!isImmersiveMode}
        onHide={() => setIsImmersiveMode(true)}
        onSelectTab={setActiveTabId}
        onAddTab={() => addTab()}
        onAddPane={() => addPane(currentTab.id, settings.defaultNewPaneUrl)}
        onCloneTabIntoNewSession={cloneTabIntoNewSession}
        onCloseTab={closeTab}
        onResetTabSession={resetTabSession}
        onRenameTab={renameTab}
        onResetGridSplit={() => {
          updateGridSplit(currentTab.id, 50, 50);
          if (currentTab.maximizedPane) {
            toggleMaximizePane(currentTab.id, currentTab.maximizedPane);
          }
        }}
        onSetSplit={(x, y) => {
          updateGridSplit(currentTab.id, x, y);
          if (currentTab.maximizedPane) {
            toggleMaximizePane(currentTab.id, currentTab.maximizedPane);
          }
        }}
        onApplyPreset={(urls) => applyPresetToTab(currentTab.id, urls)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Grid Viewport for Active Tab */}
      <div
        className={`relative flex-1 w-full overflow-hidden transition-all duration-300 ease-in-out ${
          isImmersiveMode
            ? 'h-[100dvh]'
            : showMobileBottomBar
            ? isMobile
              ? 'h-[calc(100dvh-32px-56px)]'
              : 'h-[calc(100dvh-40px-56px)]'
            : isMobile
            ? 'h-[calc(100dvh-32px)]'
            : 'h-[calc(100dvh-40px)]'
        }`}
      >
        {tabs.map((tab) => {
          const isCurrent = tab.id === currentTab.id;
          return (
            <div
              key={tab.id}
              className={
                isCurrent ? 'w-full h-full flex flex-col' : 'hidden w-full h-full'
              }
            >
              <QuadGrid
                tab={tab}
                maximizeShortcuts={settings.maximizeShortcuts}
                enableLiteMode={settings.enableLiteMode}
                muteBackgroundPanes={settings.muteBackgroundPanes}
                defaultZoomLevel={settings.defaultZoomLevel}
                hideToolbar={isImmersiveMode}
                onFocusPane={(paneId) => setActivePane(tab.id, paneId)}
                onNavigatePane={(paneId, input) => navigatePane(tab.id, paneId, input)}
                onBackPane={(paneId) => goBackPane(tab.id, paneId)}
                onForwardPane={(paneId) => goForwardPane(tab.id, paneId)}
                onReloadPane={(paneId) => reloadPane(tab.id, paneId)}
                onUpdatePane={(paneId, updater) => updatePane(tab.id, paneId, updater)}
                onToggleMaximizePane={(paneId) => toggleMaximizePane(tab.id, paneId)}
                onClosePane={(paneId) => removePane(tab.id, paneId)}
                onUpdateGridSplit={(splitX, splitY) =>
                  updateGridSplit(tab.id, splitX, splitY)
                }
              />
            </div>
          );
        })}
      </div>

      {/* Mobile Bottom Navigation Bar in Portrait mode */}
      {showMobileBottomBar && !isImmersiveMode && (
        <MobileBottomNav
          tab={currentTab}
          activePaneId={currentTab.activePane}
          isDualSplit={isDualSplit}
          keepScreenAwake={settings.keepScreenAwake}
          enableEcoBatteryMode={settings.enableEcoBatteryMode}
          onToggleImmersiveMode={() => setIsImmersiveMode(true)}
          onSelectPane={(paneId) => {
            setActivePane(currentTab.id, paneId);
            if (!isDualSplit) {
              toggleMaximizePane(currentTab.id, paneId);
            }
          }}
          onAddPane={() => addPane(currentTab.id, settings.defaultNewPaneUrl)}
          onToggleDualSplit={() => {
            setIsDualSplit((prev) => !prev);
            if (currentTab.maximizedPane) {
              toggleMaximizePane(currentTab.id, currentTab.maximizedPane);
            }
          }}
          onToggleWakeLock={() =>
            updateSetting('keepScreenAwake', !settings.keepScreenAwake)
          }
          onToggleEcoMode={() =>
            updateSetting('enableEcoBatteryMode', !settings.enableEcoBatteryMode)
          }
          onClearMemory={handleClearRamCache}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSetting={updateSetting}
        onSetModifierKey={setModifierKey}
        onSetShortcut={setShortcut}
        onResetSettings={resetSettings}
        onClearRamCache={handleClearRamCache}
      />
    </div>
  );
};

export default App;
