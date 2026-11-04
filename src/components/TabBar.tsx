import React, { useState, useRef } from 'react';
import {
  Plus,
  X,
  ShieldCheck,
  CopySimple,
  Broom,
  SquaresFour,
  ArrowsInLineHorizontal,
  Gear,
  CaretUp,
  LockKey,
  ClockCounterClockwise,
  DownloadSimple,
} from '@phosphor-icons/react';
import type { BrowserTab } from '../types/browser.types';
import { getDisplayHost, GRID_PRESETS } from '../utils/url.utils';
import { useMobileView } from '../hooks/useMobileView';

interface TabBarProps {
  tabs: BrowserTab[];
  activeTabId: string;
  splitX?: number;
  splitY?: number;
  maximizedPane?: string | null;
  isVisible?: boolean;
  onHide?: () => void;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onAddPane: () => void;
  onCloneTabIntoNewSession: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onResetTabSession: (tabId: string) => void;
  onRenameTab: (tabId: string, title: string) => void;
  onResetGridSplit: () => void;
  onSetSplit?: (splitX: number, splitY: number) => void;
  onApplyPreset: (urls: Record<string, string>) => void;
  onOpenSettings: () => void;
  onOpenVault?: () => void;
  onOpenHistory?: () => void;
  onOpenDownloads?: () => void;
  activeDownloadsCount?: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  splitX = 50,
  splitY = 50,
  maximizedPane = null,
  isVisible = true,
  onHide,
  onSelectTab,
  onAddTab,
  onAddPane,
  onCloneTabIntoNewSession,
  onCloseTab,
  onResetTabSession,
  onRenameTab,
  onResetGridSplit,
  onSetSplit,
  onApplyPreset,
  onOpenSettings,
  onOpenVault,
  onOpenHistory,
  onOpenDownloads,
  activeDownloadsCount = 0,
}) => {
  const { isMobile, isPortrait } = useMobileView();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [sessionToast, setSessionToast] = useState<string | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (deltaY > 15 && onHide) {
        onHide();
      }
      touchStartY.current = null;
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const showToast = (msg: string) => {
    setSessionToast(msg);
    setTimeout(() => {
      setSessionToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleStartRename = (tab: BrowserTab) => {
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleFinishRename = (tabId: string) => {
    if (editingTitle.trim()) {
      onRenameTab(tabId, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  const getTabSubLabel = (tab: BrowserTab): string => {
    const paneIds = tab.paneOrder || Object.keys(tab.panes);
    const activeHosts = paneIds
      .map((q) => tab.panes[q]?.url)
      .filter((u) => u && u !== 'about:blank')
      .map((u) => getDisplayHost(u));
    const count = paneIds.length;
    if (activeHosts.length === 0) return `${count} tela${count > 1 ? 's' : ''}`;
    return `${activeHosts.length}/${count} • ${activeHosts[0]}`;
  };

  const currentWindowCount = activeTab?.paneOrder?.length || Object.keys(activeTab?.panes || {}).length || 1;

  return (
    <header
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`${
        isMobile ? 'h-[32px] px-1.5' : 'h-[40px] px-2'
      } bg-[#090A0C] border-b border-[#232832] flex items-center justify-between select-none shrink-0 z-30 relative transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Left: Brand Identity + Tab Strip */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar pr-1.5">
        <div
          className={`flex items-center ${
            isMobile ? 'gap-1 px-1.5 py-0.5' : 'gap-2 px-2.5 py-1'
          } bg-[#111317] border border-[#232832] rounded-[2px] shrink-0`}
          title="4Nav — Navegador Multi-Sessão Otimizado para Jogos Idle"
        >
          <SquaresFour size={isMobile ? 13 : 16} weight="bold" className="text-[#3B82F6]" />
          <span className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} font-bold tracking-wider uppercase text-[#F3F4F6]`}>
            4NAV
          </span>
          {!isMobile && (
            <span className="text-[9px] font-mono px-1 py-0.2 bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30 rounded-[2px]">
              IDLE HUB
            </span>
          )}
        </div>

        {/* Browser Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                onDoubleClick={() => handleStartRename(tab)}
                role="tab"
                aria-selected={isActive}
                style={{
                  borderTopColor: isActive ? tab.containerColor : 'transparent',
                }}
                className={`group relative flex items-center ${
                  isMobile
                    ? 'gap-1 px-1.5 h-[24px] min-w-[110px] max-w-[160px]'
                    : 'gap-2 px-2.5 h-[30px] min-w-[160px] max-w-[230px]'
                } rounded-[2px] border border-[#232832] border-t-2 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#181B21] text-[#F3F4F6] shadow-sm'
                    : 'bg-[#111317] text-[#9CA3AF] hover:bg-[#15181F] hover:text-[#F3F4F6]'
                }`}
              >
                {/* Isolated Container Indicator Dot & Number */}
                <span
                  className={`flex items-center gap-0.5 ${
                    isMobile ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
                  } font-mono font-semibold rounded-[2px] shrink-0`}
                  style={{
                    backgroundColor: `${tab.containerColor}1F`,
                    color: tab.containerColor,
                    border: `1px solid ${tab.containerColor}4D`,
                  }}
                  title={`Sessão Isolada #${tab.sessionNumber} (${tab.sessionId})`}
                >
                  <ShieldCheck size={isMobile ? 9 : 11} weight="fill" />#{tab.sessionNumber}
                </span>

                {/* Tab Title & Host Preview */}
                <div className="flex flex-col min-w-0 flex-1 leading-tight">
                  {editingTabId === tab.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleFinishRename(tab.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRename(tab.id);
                        if (e.key === 'Escape') setEditingTabId(null);
                      }}
                      autoFocus
                      aria-label="Renomear aba"
                      className="bg-[#090A0C] text-[#F3F4F6] text-[10px] px-1 py-0 border border-[#3B82F6] rounded-[2px] outline-none w-full"
                    />
                  ) : (
                    <>
                      <span className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} font-medium truncate`}>
                        {tab.title}
                      </span>
                      {!isMobile && (
                        <span className="text-[9px] font-mono text-[#6B7280] truncate">
                          {getTabSubLabel(tab)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Close Tab Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  title="Fechar aba e encerrar sessão"
                  aria-label={`Fechar ${tab.title}`}
                  className="p-0.5 rounded-[2px] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#232832] transition-colors shrink-0"
                >
                  <X size={isMobile ? 10 : 12} weight="bold" />
                </button>
              </div>
            );
          })}

          {/* "+" New Isolated Tab Button */}
          <button
            type="button"
            onClick={() => {
              onAddTab();
              showToast('Nova aba criada com container de sessão isolado!');
            }}
            title="Nova Aba (+) — Cria um novo ambiente com sessão e cookies independentes"
            aria-label="Nova Aba"
            className={`flex items-center gap-1 ${
              isMobile ? 'px-1.5 h-[24px]' : 'px-2.5 h-[30px]'
            } bg-[#111317] hover:bg-[#181B21] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[11px] font-semibold transition-colors shrink-0 cursor-pointer`}
          >
            <Plus size={isMobile ? 12 : 14} weight="bold" />
            <span className="hidden sm:inline">Nova Aba</span>
          </button>
        </div>
      </div>

      {/* Right: Quick Resizing + Actions + Settings */}
      <div className="flex items-center gap-1.5 shrink-0">
        {sessionToast && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-[#3B82F6] text-[10px] font-mono rounded-[2px]">
            <ShieldCheck size={12} weight="fill" />
            <span>{sessionToast}</span>
          </div>
        )}

        {/* Clone Current Tab into a Fresh Unauthenticated Session (Desktop only) */}
        {activeTab && !isMobile && (
          <button
            type="button"
            onClick={() => {
              onCloneTabIntoNewSession(activeTab.id);
              showToast('Aba clonada em nova sessão!');
            }}
            title="Duplicar aba em nova sessão isolada"
            className="hidden xl:flex items-center gap-1 px-1.5 h-[26px] bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[10px] transition-colors cursor-pointer"
          >
            <CopySimple size={12} className="text-[#06B6D4]" />
            <span>Clonar</span>
          </button>
        )}

        {/* Clear Current Tab Cookies (Desktop only) */}
        {activeTab && !isMobile && (
          <button
            type="button"
            onClick={() => {
              onResetTabSession(activeTab.id);
              showToast(`Sessão #${activeTab.sessionNumber} limpa!`);
            }}
            title="Limpar cookies e logins desta aba"
            className="hidden xl:flex items-center gap-1 px-1.5 h-[26px] bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[10px] transition-colors cursor-pointer"
          >
            <Broom size={12} className="text-[#F59E0B]" />
            <span>Limpar</span>
          </button>
        )}

        {/* Fast Screen Resizing Quick Presets (50:50, 70:30, 30:70) */}
        {currentWindowCount === 2 && onSetSplit && (
          <div className="flex items-center bg-[#111317] p-0.5 rounded-[2px] border border-[#232832] shrink-0">
            {maximizedPane ? (
              <button
                type="button"
                onClick={onResetGridSplit}
                title="Restaurar divisão em 2 janelas"
                className="px-1.5 py-0.5 bg-[#3B82F6] text-[#090A0C] font-bold text-[9px] rounded-[2px] hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Restaurar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => (isPortrait ? onSetSplit(splitX, 50) : onSetSplit(50, splitY))}
                  title="Divisão 50% / 50% (Equilibrado)"
                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                    Math.round(isPortrait ? splitY : splitX) === 50
                      ? 'bg-[#3B82F6] text-[#090A0C] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#181B21]'
                  }`}
                >
                  50:50
                </button>
                <button
                  type="button"
                  onClick={() => (isPortrait ? onSetSplit(splitX, 70) : onSetSplit(70, splitY))}
                  title={isPortrait ? "Divisão 70% Cima / 30% Baixo" : "Divisão 70% / 30% (Foco Esquerda)"}
                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                    Math.round(isPortrait ? splitY : splitX) === 70
                      ? 'bg-[#3B82F6] text-[#090A0C] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#181B21]'
                  }`}
                >
                  70:30
                </button>
                <button
                  type="button"
                  onClick={() => (isPortrait ? onSetSplit(splitX, 30) : onSetSplit(30, splitY))}
                  title={isPortrait ? "Divisão 30% Cima / 70% Baixo" : "Divisão 30% / 70% (Foco Direita)"}
                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded-[2px] transition-colors cursor-pointer ${
                    Math.round(isPortrait ? splitY : splitX) === 30
                      ? 'bg-[#3B82F6] text-[#090A0C] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#181B21]'
                  }`}
                >
                  30:70
                </button>
              </>
            )}
          </div>
        )}

        {/* Desktop 4-window 50x50 reset */}
        {currentWindowCount > 2 && (
          <button
            type="button"
            onClick={onResetGridSplit}
            title="Restaurar proporção 50% × 50% dos quadrantes"
            className="flex items-center gap-1 px-1.5 h-[24px] bg-[#111317] hover:bg-[#181B21] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[10px] transition-colors cursor-pointer"
          >
            <ArrowsInLineHorizontal size={12} />
            <span className="hidden sm:inline">50×50</span>
          </button>
        )}

        {/* "+ Adicionar Janela" Button */}
        <button
          type="button"
          onClick={() => {
            onAddPane();
            showToast('Nova janela de jogo adicionada à aba!');
          }}
          title="Adicionar Tela (+ Janela)"
          className={`flex items-center gap-1 ${
            isMobile ? 'px-1.5 h-[24px] text-[10px]' : 'px-2.5 h-[26px] text-[11px]'
          } bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 text-[#3B82F6] border border-[#3B82F6]/40 rounded-[2px] font-bold transition-colors cursor-pointer`}
        >
          <Plus size={isMobile ? 11 : 13} weight="bold" />
          <span>+ Janela</span>
          <span className="text-[9px] font-mono px-1 py-0.2 bg-[#3B82F6]/20 rounded-[2px]">
            {currentWindowCount}
          </span>
        </button>

        {/* Presets Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetMenuOpen((prev) => !prev)}
            title="Carregar presets de jogos e telas"
            className={`flex items-center gap-1 ${
              isMobile ? 'w-[24px] h-[24px] justify-center px-0' : 'px-2.5 h-[26px]'
            } bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer`}
          >
            <SquaresFour size={13} className="text-[#EAB308]" />
            <span className="hidden md:inline">Presets</span>
          </button>

          {presetMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPresetMenuOpen(false)}
              />
              <div className="absolute right-0 top-[30px] w-[280px] bg-[#111317] border border-[#232832] rounded-[2px] shadow-2xl p-1.5 z-50">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] border-b border-[#232832] mb-1">
                  Carregar Grade de Telas
                </div>
                {GRID_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onApplyPreset(preset.urls);
                      setPresetMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-[#181B21] rounded-[2px] transition-colors flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="text-[11px] font-medium text-[#F3F4F6]">
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-[#9CA3AF]">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Navigation History Button (Opera GX Style) */}
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            title="Histórico de Navegação (Ctrl+H)"
            className={`flex items-center gap-1 ${
              isMobile ? 'w-[24px] h-[24px] justify-center px-0' : 'px-2.5 h-[26px]'
            } bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] hover:border-[#EAB308]/50 rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer`}
          >
            <ClockCounterClockwise size={13} className="text-[#EAB308]" weight="bold" />
            <span className="hidden sm:inline">Histórico</span>
          </button>
        )}

        {/* Downloads Manager Button (Opera GX Style) */}
        {onOpenDownloads && (
          <button
            type="button"
            onClick={onOpenDownloads}
            title="Downloads (Ctrl+J)"
            className={`relative flex items-center gap-1 ${
              isMobile ? 'w-[24px] h-[24px] justify-center px-0' : 'px-2.5 h-[26px]'
            } bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] hover:border-[#3B82F6]/50 rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer`}
          >
            <DownloadSimple size={13} className="text-[#3B82F6]" weight="bold" />
            <span className="hidden sm:inline">Downloads</span>
            {activeDownloadsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-[14px] bg-[#10B981] text-black font-bold text-[8px] rounded-full flex items-center justify-center animate-pulse">
                {activeDownloadsCount}
              </span>
            )}
          </button>
        )}

        {/* Credentials Vault Button */}
        {onOpenVault && (
          <button
            type="button"
            onClick={onOpenVault}
            title="Cofre de Senhas & Contas (Protegido por PIN Mestre PBKDF2 e Auto-Lock de 5 min)"
            className={`flex items-center gap-1 ${
              isMobile ? 'w-[24px] h-[24px] justify-center px-0' : 'px-2.5 h-[26px]'
            } bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] hover:border-[#3B82F6]/50 rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer`}
          >
            <LockKey size={13} className="text-[#3B82F6]" weight="bold" />
            <span className="hidden sm:inline">Cofre</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Configurações (Otimização para Jogos Idle e Atalhos)"
          className={`flex items-center gap-1 ${
            isMobile ? 'w-[24px] h-[24px] justify-center px-0' : 'px-2.5 h-[26px]'
          } bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] hover:border-[#EAB308]/50 rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer`}
        >
          <Gear size={13} className="text-[#EAB308]" weight="bold" />
          <span className="hidden sm:inline">Configurações</span>
        </button>

        {/* Hide All Bars / Immersive Mode Button */}
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            title="Modo Imersivo: Ocultar todas as barras (ou deslize para cima)"
            aria-label="Ocultar todas as barras"
            className="w-[24px] h-[24px] flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#3B82F6] bg-[#111317] border border-[#232832] transition-colors cursor-pointer shrink-0"
          >
            <CaretUp size={13} weight="bold" />
          </button>
        )}
      </div>
    </header>
  );
};

