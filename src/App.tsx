import React, { useState, useEffect, useCallback } from 'react';
import { useBrowserState } from './hooks/useBrowserState';
import { useSettings } from './hooks/useSettings';
import { TabBar } from './components/TabBar';
import { QuadGrid } from './components/QuadGrid';
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

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    if (typeof window !== 'undefined' && window.electronAPI?.clearSession) {
      for (const tab of tabs) {
        await window.electronAPI.clearSession(`persist:${tab.sessionId}`).catch(() => {});
      }
    }
  }, [tabs]);

  if (!currentTab) return null;

  return (
    <div className="w-screen h-[100dvh] bg-[#090A0C] text-[#F3F4F6] flex flex-col overflow-hidden">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
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
        onApplyPreset={(urls) => applyPresetToTab(currentTab.id, urls)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Grid Viewport for Active Tab */}
      <div className="relative flex-1 w-full h-[calc(100dvh-42px)] overflow-hidden">
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
