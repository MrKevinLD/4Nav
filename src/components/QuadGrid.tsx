import React, { useState, useRef, useEffect } from 'react';
import type { BrowserTab, PaneState } from '../types/browser.types';
import { useMobileView } from '../hooks/useMobileView';
import { QuadrantPane } from './QuadrantPane';

interface QuadGridProps {
  tab: BrowserTab;
  maximizeShortcuts?: Record<number, string>;
  enableLiteMode?: boolean;
  muteBackgroundPanes?: boolean;
  defaultZoomLevel?: number;
  hideToolbar?: boolean;
  onFocusPane: (paneId: string) => void;
  onNavigatePane: (paneId: string, rawInput: string) => void;
  onBackPane: (paneId: string) => void;
  onForwardPane: (paneId: string) => void;
  onReloadPane: (paneId: string) => void;
  onUpdatePane: (paneId: string, updater: (p: PaneState) => PaneState) => void;
  onToggleMaximizePane: (paneId: string) => void;
  onClosePane?: (paneId: string) => void;
  onUpdateGridSplit: (splitX: number, splitY: number) => void;
}

type DragAxis = 'x' | 'y' | 'both' | null;

export const QuadGrid: React.FC<QuadGridProps> = ({
  tab,
  maximizeShortcuts,
  enableLiteMode,
  muteBackgroundPanes,
  defaultZoomLevel = 1,
  hideToolbar = false,
  onFocusPane,
  onNavigatePane,
  onBackPane,
  onForwardPane,
  onReloadPane,
  onUpdatePane,
  onToggleMaximizePane,
  onClosePane,
  onUpdateGridSplit,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragAxis, setDragAxis] = useState<DragAxis>(null);

  const paneIds = tab.paneOrder && tab.paneOrder.length > 0
    ? tab.paneOrder
    : Object.keys(tab.panes);
  const paneCount = paneIds.length;
  const { splitX, splitY, maximizedPane } = tab;

  useEffect(() => {
    if (!dragAxis) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nextX =
        dragAxis === 'x' || dragAxis === 'both'
          ? ((e.clientX - rect.left) / rect.width) * 100
          : tab.splitX;
      const nextY =
        dragAxis === 'y' || dragAxis === 'both'
          ? ((e.clientY - rect.top) / rect.height) * 100
          : tab.splitY;

      onUpdateGridSplit(nextX, nextY);
    };

    const handlePointerUp = () => {
      setDragAxis(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragAxis, tab.splitX, tab.splitY, onUpdateGridSplit]);

  const { isMobile, isPortrait } = useMobileView();

  const renderQuadrant = (paneId: string, index: number) => {
    const pane = tab.panes[paneId];
    if (!pane) return null;
    const isMax = maximizedPane === paneId;
    const isHidden = Boolean(maximizedPane && !isMax);
    const shortcut = isMobile ? undefined : maximizeShortcuts?.[index + 1];

    return (
      <div
        key={paneId}
        className={
          isHidden
            ? 'hidden'
            : 'w-full h-full min-w-0 min-h-0 overflow-hidden'
        }
      >
        <QuadrantPane
          pane={pane}
          tabSessionNumber={tab.sessionNumber}
          tabSessionId={tab.sessionId}
          containerColor={tab.containerColor}
          isActive={tab.activePane === paneId}
          isMaximized={isMax}
          shortcutLabel={shortcut}
          canClose={paneCount > 1}
          hideToolbar={hideToolbar}
          enableLiteMode={enableLiteMode}
          muteBackgroundPanes={muteBackgroundPanes}
          defaultZoomLevel={defaultZoomLevel}
          onFocusPane={() => onFocusPane(paneId)}
          onNavigate={(input) => onNavigatePane(paneId, input)}
          onBack={() => onBackPane(paneId)}
          onForward={() => onForwardPane(paneId)}
          onReload={() => onReloadPane(paneId)}
          onUpdatePane={(updater) => onUpdatePane(paneId, updater)}
          onToggleMaximize={() => onToggleMaximizePane(paneId)}
          onClosePane={() => onClosePane?.(paneId)}
        />
      </div>
    );
  };

  // 1 Window Layout: 100% full screen
  if (paneCount === 1) {
    return (
      <main
        ref={containerRef}
        className="relative flex-1 w-full h-full bg-[#090A0C] overflow-hidden"
      >
        {renderQuadrant(paneIds[0], 0)}
      </main>
    );
  }

  // 2 Windows Layout: Split column (landscape) or row (portrait) layout with interactive splitter
  if (paneCount === 2) {
    const isVerticalSplit = isPortrait;
    return (
      <main
        ref={containerRef}
        className="relative flex-1 w-full h-full bg-[#090A0C] overflow-hidden"
      >
        {dragAxis && <div className="absolute inset-0 z-40 cursor-move" />}

        {maximizedPane && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1 bg-[#090A0C]/90 border border-[#3B82F6] rounded-[2px] shadow-2xl backdrop-blur text-[11px] text-[#F3F4F6]">
            <span className="font-bold text-[#3B82F6]">Janela Maximizada</span>
            <span className="text-[#9CA3AF] text-[10px]">
              {maximizeShortcuts?.[paneIds.indexOf(maximizedPane) + 1]
                ? `(${maximizeShortcuts[paneIds.indexOf(maximizedPane) + 1]} ou ESC para restaurar)`
                : '(ESC para restaurar)'}
            </span>
            <button
              type="button"
              onClick={() => onToggleMaximizePane(maximizedPane)}
              className="px-2 py-0.5 bg-[#3B82F6] text-[#FFFFFF] font-bold rounded-[2px] text-[10px] hover:bg-[#2563EB] transition-colors cursor-pointer"
            >
              Restaurar Grade
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            width: '100%',
            height: '100%',
            gridTemplateColumns: maximizedPane
              ? '1fr'
              : isVerticalSplit
              ? '1fr'
              : `${splitX}% 4px calc(${100 - splitX}% - 4px)`,
            gridTemplateRows: maximizedPane
              ? '1fr'
              : isVerticalSplit
              ? `${splitY}% 4px calc(${100 - splitY}% - 4px)`
              : '1fr',
          }}
        >
          {renderQuadrant(paneIds[0], 0)}

          {!maximizedPane && (
            <div
              onPointerDown={() => setDragAxis(isVerticalSplit ? 'y' : 'x')}
              onDoubleClick={() =>
                onUpdateGridSplit(isVerticalSplit ? splitX : 50, isVerticalSplit ? 50 : splitY)
              }
              title={
                isVerticalSplit
                  ? 'Arraste para redimensionar verticalmente (Duplo-clique para 50%)'
                  : 'Arraste para redimensionar (Duplo-clique para 50%)'
              }
              className={`relative w-full h-full bg-[#111317] hover:bg-[#3B82F6] active:bg-[#3B82F6] transition-colors z-30 group select-none ${
                isVerticalSplit ? 'cursor-row-resize' : 'cursor-col-resize'
              }`}
            >
              {/* Expanded touch target for fingers on mobile */}
              <div
                className={`absolute z-40 ${
                  isVerticalSplit
                    ? 'inset-x-0 -top-3 -bottom-3 cursor-row-resize'
                    : 'inset-y-0 -left-3 -right-3 cursor-col-resize'
                }`}
              />
              {/* Visual touch drag pill handle */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#181B21] border border-[#232832] group-hover:border-[#3B82F6] group-hover:bg-[#3B82F6]/20 rounded-full flex items-center justify-center gap-1 shadow-lg pointer-events-none transition-colors ${
                  isVerticalSplit
                    ? 'w-[36px] h-[14px] flex-row'
                    : 'w-[14px] h-[36px] flex-col'
                }`}
              >
                <div className="w-[3px] h-[3px] rounded-full bg-[#9CA3AF] group-hover:bg-[#3B82F6]" />
                <div className="w-[3px] h-[3px] rounded-full bg-[#9CA3AF] group-hover:bg-[#3B82F6]" />
                <div className="w-[3px] h-[3px] rounded-full bg-[#9CA3AF] group-hover:bg-[#3B82F6]" />
              </div>
            </div>
          )}

          {renderQuadrant(paneIds[1], 1)}
        </div>
      </main>
    );
  }

  // 4 Windows Layout: Classical 2x2 Grid with full 4-way splitters
  if (paneCount === 4) {
    return (
      <main
        ref={containerRef}
        className="relative flex-1 w-full h-full bg-[#090A0C] overflow-hidden"
      >
        {dragAxis && <div className="absolute inset-0 z-40 cursor-move" />}

        {maximizedPane && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1 bg-[#090A0C]/90 border border-[#3B82F6] rounded-[2px] shadow-2xl backdrop-blur text-[11px] text-[#F3F4F6]">
            <span className="font-bold text-[#3B82F6]">Janela Maximizada</span>
            <span className="text-[#9CA3AF] text-[10px]">
              {maximizeShortcuts?.[paneIds.indexOf(maximizedPane) + 1]
                ? `(${maximizeShortcuts[paneIds.indexOf(maximizedPane) + 1]} ou ESC para restaurar)`
                : '(ESC para restaurar)'}
            </span>
            <button
              type="button"
              onClick={() => onToggleMaximizePane(maximizedPane)}
              className="px-2 py-0.5 bg-[#3B82F6] text-[#FFFFFF] font-bold rounded-[2px] text-[10px] hover:bg-[#2563EB] transition-colors cursor-pointer"
            >
              Restaurar Grade
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            width: '100%',
            height: '100%',
            gridTemplateColumns: maximizedPane
              ? '1fr'
              : `${splitX}% 4px calc(${100 - splitX}% - 4px)`,
            gridTemplateRows: maximizedPane
              ? '1fr'
              : `${splitY}% 4px calc(${100 - splitY}% - 4px)`,
          }}
        >
          {renderQuadrant(paneIds[0], 0)}

          {!maximizedPane && (
            <div
              onPointerDown={() => setDragAxis('x')}
              onDoubleClick={() => onUpdateGridSplit(50, splitY)}
              title="Arraste para redimensionar horizontalmente (Duplo-clique para 50%)"
              className="relative w-full h-full bg-[#111317] hover:bg-[#3B82F6] active:bg-[#3B82F6] cursor-col-resize transition-colors row-span-3 col-start-2 row-start-1 z-30 group select-none"
            >
              <div className="absolute inset-y-0 -left-3 -right-3 z-40 cursor-col-resize" />
            </div>
          )}

          {renderQuadrant(paneIds[1], 1)}

          {!maximizedPane && (
            <div
              onPointerDown={() => setDragAxis('y')}
              onDoubleClick={() => onUpdateGridSplit(splitX, 50)}
              title="Arraste para redimensionar verticalmente (Duplo-clique para 50%)"
              className="relative w-full h-full bg-[#111317] hover:bg-[#3B82F6] active:bg-[#3B82F6] cursor-row-resize transition-colors col-span-3 col-start-1 row-start-2 z-30 group select-none"
            >
              <div className="absolute inset-x-0 -top-3 -bottom-3 z-40 cursor-row-resize" />
            </div>
          )}

          {renderQuadrant(paneIds[2], 2)}
          {renderQuadrant(paneIds[3], 3)}
        </div>

        {!maximizedPane && (
          <div
            onPointerDown={() => setDragAxis('both')}
            onDoubleClick={() => onUpdateGridSplit(50, 50)}
            style={{
              left: `calc(${splitX}% - 6px)`,
              top: `calc(${splitY}% - 6px)`,
            }}
            title="Arraste para redimensionar os quadrantes simultaneamente (Duplo-clique para 50×50)"
            className="absolute w-3.5 h-3.5 rounded-[2px] bg-[#181B21] border border-[#3B82F6] hover:scale-125 hover:bg-[#3B82F6] cursor-move z-30 transition-transform"
          />
        )}
      </main>
    );
  }

  // 3 or 5+ Windows: Adaptive Dynamic Multi-Screen Grid
  const isPortraitMode = isPortrait;
  const cols = isPortraitMode
    ? (paneCount <= 3 ? 1 : 2)
    : (paneCount <= 3 ? 3 : paneCount <= 6 ? 3 : 4);
  const rows = isPortraitMode
    ? (paneCount <= 3 ? paneCount : Math.ceil(paneCount / 2))
    : (paneCount <= 3 ? 1 : 2);

  return (
    <main
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-[#090A0C] overflow-hidden"
    >
      {maximizedPane && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1 bg-[#090A0C]/90 border border-[#3B82F6] rounded-[2px] shadow-2xl backdrop-blur text-[11px] text-[#F3F4F6]">
          <span className="font-bold text-[#3B82F6]">Janela Maximizada</span>
          <span className="text-[#9CA3AF] text-[10px]">
            {maximizeShortcuts?.[paneIds.indexOf(maximizedPane) + 1]
              ? `(${maximizeShortcuts[paneIds.indexOf(maximizedPane) + 1]} ou ESC para restaurar)`
              : '(ESC para restaurar)'}
          </span>
          <button
            type="button"
            onClick={() => onToggleMaximizePane(maximizedPane)}
            className="px-2 py-0.5 bg-[#3B82F6] text-[#FFFFFF] font-bold rounded-[2px] text-[10px] hover:bg-[#2563EB] transition-colors cursor-pointer"
          >
            Restaurar Grade
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          width: '100%',
          height: '100%',
          gridTemplateColumns: maximizedPane ? '1fr' : `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: maximizedPane ? '1fr' : `repeat(${rows}, minmax(0, 1fr))`,
          gap: maximizedPane ? '0px' : '3px',
        }}
      >
        {paneIds.map((pId, idx) => renderQuadrant(pId, idx))}
      </div>
    </main>
  );
};
