import React from 'react';
import {
  Plus,
  Gear,
  Rows,
  Square,
} from '@phosphor-icons/react';
import type { BrowserTab } from '../types/browser.types';

interface MobileBottomNavProps {
  tab: BrowserTab;
  activePaneId: string;
  isDualSplit: boolean;
  onSelectPane: (paneId: string) => void;
  onAddPane: () => void;
  onToggleDualSplit: () => void;
  onOpenSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  tab,
  activePaneId,
  isDualSplit,
  onSelectPane,
  onAddPane,
  onToggleDualSplit,
  onOpenSettings,
}) => {
  const paneIds = tab.paneOrder && tab.paneOrder.length > 0
    ? tab.paneOrder
    : Object.keys(tab.panes);

  return (
    <nav className="h-[56px] bg-[#090A0C] border-t border-[#232832] flex items-center justify-between px-2 select-none shrink-0 z-40 safe-bottom">
      {/* Scrollable Account / Window Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1 mr-2">
        {paneIds.map((paneId, index) => {
          const isActive = activePaneId === paneId;
          const num = index + 1;
          return (
            <button
              key={paneId}
              type="button"
              onClick={() => onSelectPane(paneId)}
              className={`min-w-[44px] h-[40px] px-2.5 flex items-center justify-center gap-1 rounded-[3px] text-xs font-mono font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#10B981] text-[#090A0C] shadow-lg shadow-[#10B981]/20'
                  : 'bg-[#111317] text-[#9CA3AF] border border-[#232832] active:bg-[#181B21]'
              }`}
            >
              <span>J{num}</span>
            </button>
          );
        })}

        {/* "+ Janela" Button */}
        <button
          type="button"
          onClick={onAddPane}
          title="Adicionar nova conta de jogo"
          className="w-[42px] h-[40px] bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] rounded-[3px] flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} weight="bold" />
        </button>
      </div>

      {/* Right Controls: Split Mode Toggle & Settings */}
      <div className="flex items-center gap-1 shrink-0">
        {paneIds.length >= 2 && (
          <button
            type="button"
            onClick={onToggleDualSplit}
            title={isDualSplit ? 'Visualização Única' : 'Tela Dupla (2x1)'}
            className={`w-[40px] h-[40px] flex items-center justify-center rounded-[3px] border transition-colors cursor-pointer ${
              isDualSplit
                ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                : 'bg-[#111317] border-[#232832] text-[#9CA3AF] active:bg-[#181B21]'
            }`}
          >
            {isDualSplit ? <Square size={18} /> : <Rows size={18} />}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          title="Configurações & Modo Leve"
          className="w-[40px] h-[40px] bg-[#111317] border border-[#232832] text-[#9CA3AF] active:text-[#10B981] rounded-[3px] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <Gear size={18} />
        </button>
      </div>
    </nav>
  );
};
