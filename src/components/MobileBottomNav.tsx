import React, { useState } from 'react';
import {
  Plus,
  Gear,
  Rows,
  Square,
  Sun,
  SunDim,
  Lightning,
  Broom,
  BatteryCharging,
  BatteryHigh,
  BatteryMedium,
  BatteryLow,
  Check,
  CornersOut,
} from '@phosphor-icons/react';
import type { BrowserTab } from '../types/browser.types';
import { useDeviceBattery } from '../hooks/useDeviceBattery';

interface MobileBottomNavProps {
  tab: BrowserTab;
  activePaneId: string;
  isDualSplit: boolean;
  keepScreenAwake: boolean;
  enableEcoBatteryMode: boolean;
  onSelectPane: (paneId: string) => void;
  onClosePane?: (paneId: string) => void;
  onAddPane: () => void;
  onToggleDualSplit: () => void;
  onToggleWakeLock: () => void;
  onToggleEcoMode: () => void;
  onClearMemory: () => void;
  onOpenSettings: () => void;
  onToggleImmersiveMode?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  tab,
  activePaneId,
  isDualSplit,
  keepScreenAwake,
  enableEcoBatteryMode,
  onSelectPane,
  onClosePane,
  onAddPane,
  onToggleDualSplit,
  onToggleWakeLock,
  onToggleEcoMode,
  onClearMemory,
  onOpenSettings,
  onToggleImmersiveMode,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const battery = useDeviceBattery();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleCleanMemoryClick = () => {
    onClearMemory();
    showToast('Memória RAM & Caches Liberados!');
  };

  const handleWakeLockClick = () => {
    onToggleWakeLock();
    showToast(keepScreenAwake ? 'Bloqueio de tela restaurado' : 'Tela sempre ligada (Anti-bloqueio ATIVO)');
  };

  const handleEcoClick = () => {
    onToggleEcoMode();
    showToast(enableEcoBatteryMode ? 'Modo Normal (60 FPS)' : 'Modo Eco Ativo (Economia de Bateria/CPU)');
  };

  const paneIds = tab.paneOrder && tab.paneOrder.length > 0
    ? tab.paneOrder
    : Object.keys(tab.panes);

  const getBatteryIcon = () => {
    if (battery.charging) return <BatteryCharging size={13} className="text-[#3B82F6]" />;
    if (battery.level > 60) return <BatteryHigh size={13} className="text-[#3B82F6]" />;
    if (battery.level > 20) return <BatteryMedium size={13} className="text-[#F59E0B]" />;
    return <BatteryLow size={13} className="text-[#EF4444]" />;
  };

  return (
    <div className="relative select-none shrink-0 z-40">
      {/* Dynamic Toast Feedback Pill */}
      {toastMessage && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#111317] border border-[#EAB308]/50 text-[#EAB308] text-[11px] font-mono font-bold rounded-full shadow-2xl flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap pointer-events-none z-50">
          <Check size={12} weight="bold" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Touch Navigation Bar */}
      <nav className="h-[58px] bg-[#090A0C] border-t border-[#232832] flex items-center justify-between px-2 safe-bottom">
        {/* Left Scrollable Account / Window Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 flex-1 mr-2">
          {paneIds.map((paneId, index) => {
            const isActive = activePaneId === paneId;
            const num = index + 1;
            return (
              <div key={paneId} className="relative flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectPane(paneId)}
                  aria-label={`Conta ${num}`}
                  className={`min-w-[46px] h-[42px] px-2.5 flex items-center justify-center gap-1 rounded-[3px] text-xs font-mono font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3B82F6] text-[#090A0C] shadow-lg shadow-[#3B82F6]/25 ring-1 ring-[#3B82F6]'
                      : 'bg-[#111317] text-[#9CA3AF] border border-[#232832] active:bg-[#181B21]'
                  }`}
                >
                  <span>J{num}</span>
                </button>
                {paneIds.length > 1 && onClosePane && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClosePane(paneId);
                    }}
                    title={`Fechar Janela J${num}`}
                    aria-label={`Fechar Janela J${num}`}
                    className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer active:scale-90"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* "+ Janela" Button */}
          <button
            type="button"
            onClick={onAddPane}
            title="Adicionar nova conta de jogo"
            aria-label="Adicionar nova conta"
            className="w-[42px] h-[42px] bg-[#EAB308]/15 border border-[#EAB308]/40 text-[#EAB308] rounded-[3px] flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={18} weight="bold" />
          </button>
        </div>

        {/* Right Mobile Actions: Performance, WakeLock, Split & Settings */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Keep Screen Awake (Anti-Sleep WakeLock) Toggle */}
          <button
            type="button"
            onClick={handleWakeLockClick}
            title={keepScreenAwake ? 'Tela sempre ligada (Ativa)' : 'Tela com bloqueio padrão'}
            aria-label="Manter tela ligada"
            className={`w-[38px] h-[42px] flex flex-col items-center justify-center rounded-[3px] border transition-all cursor-pointer ${
              keepScreenAwake
                ? 'bg-[#EAB308]/20 border-[#EAB308] text-[#EAB308] shadow-sm shadow-[#EAB308]/20'
                : 'bg-[#111317] border-[#232832] text-[#6B7280] active:bg-[#181B21]'
            }`}
          >
            {keepScreenAwake ? <Sun size={17} weight="fill" /> : <SunDim size={17} />}
            <span className="text-[7px] font-mono tracking-tighter mt-0.5 leading-none">
              {keepScreenAwake ? 'LIGADA' : 'AUTO'}
            </span>
          </button>

          {/* Eco Battery / Performance Mode Toggle */}
          <button
            type="button"
            onClick={handleEcoClick}
            title={enableEcoBatteryMode ? 'Modo Eco Ativo (Economia de Bateria/CPU)' : 'Modo Desempenho Normal (60 FPS)'}
            aria-label="Alternar modo eco de bateria"
            className={`w-[38px] h-[42px] flex flex-col items-center justify-center rounded-[3px] border transition-all cursor-pointer ${
              enableEcoBatteryMode
                ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6] shadow-sm shadow-[#3B82F6]/20'
                : 'bg-[#111317] border-[#232832] text-[#6B7280] active:bg-[#181B21]'
            }`}
          >
            <Lightning size={17} weight={enableEcoBatteryMode ? 'fill' : 'regular'} />
            <span className="text-[7px] font-mono tracking-tighter mt-0.5 leading-none">
              {enableEcoBatteryMode ? 'ECO' : 'MAX'}
            </span>
          </button>

          {/* Fast RAM Cleaner Button */}
          <button
            type="button"
            onClick={handleCleanMemoryClick}
            title="Liberar memória RAM e caches das contas"
            aria-label="Liberar memória RAM"
            className="w-[36px] h-[42px] bg-[#111317] border border-[#232832] text-[#9CA3AF] active:text-[#EAB308] active:scale-95 rounded-[3px] flex items-center justify-center shrink-0 transition-all cursor-pointer"
          >
            <Broom size={16} />
          </button>

          {/* Full Immersive Mode (Hide All Bars) Button */}
          {onToggleImmersiveMode && (
            <button
              type="button"
              onClick={onToggleImmersiveMode}
              title="Modo Imersivo (Ocultar todas as barras)"
              aria-label="Ocultar todas as barras"
              className="w-[36px] h-[42px] bg-[#111317] border border-[#232832] text-[#9CA3AF] active:text-[#3B82F6] active:scale-95 rounded-[3px] flex items-center justify-center shrink-0 transition-all cursor-pointer"
            >
              <CornersOut size={16} />
            </button>
          )}

          {/* Split Mode Toggle (Only if 2+ panes exist) */}
          {paneIds.length >= 2 && (
            <button
              type="button"
              onClick={onToggleDualSplit}
              title={isDualSplit ? 'Visualização Única' : 'Tela Dupla (2x1)'}
              aria-label="Modo tela dupla"
              className={`w-[36px] h-[42px] flex items-center justify-center rounded-[3px] border transition-colors cursor-pointer ${
                isDualSplit
                  ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]'
                  : 'bg-[#111317] border-[#232832] text-[#9CA3AF] active:bg-[#181B21]'
              }`}
            >
              {isDualSplit ? <Square size={16} /> : <Rows size={16} />}
            </button>
          )}

          {/* Settings Modal Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Configurações do Navegador"
            aria-label="Abrir configurações"
            className="w-[36px] h-[42px] bg-[#111317] border border-[#232832] text-[#9CA3AF] active:text-[#EAB308] rounded-[3px] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <Gear size={16} />
          </button>
        </div>
      </nav>

      {/* Battery and System Status Indicator Bar (Micro Pill) */}
      {battery.supported && (
        <div className="h-[18px] bg-[#06080A] border-t border-[#181B21] flex items-center justify-between px-3 text-[9px] font-mono text-[#6B7280]">
          <span className="flex items-center gap-1">
            {getBatteryIcon()}
            <span>Bateria: {battery.level}% {battery.charging ? '(Carregando)' : ''}</span>
          </span>
          <span className="flex items-center gap-2">
            <span>{keepScreenAwake ? '⚡ Anti-Bloqueio' : '💤 Suspensão Auto'}</span>
            <span>•</span>
            <span className={enableEcoBatteryMode ? 'text-[#3B82F6]' : 'text-[#EAB308]'}>
              {enableEcoBatteryMode ? 'Modo Eco' : '60 FPS'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
