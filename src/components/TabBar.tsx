import React, { useState } from 'react';
import {
  Plus,
  X,
  ShieldCheck,
  CopySimple,
  Broom,
  SquaresFour,
  ArrowsInLineHorizontal,
  Gear,
} from '@phosphor-icons/react';
import type { BrowserTab } from '../types/browser.types';
import { getDisplayHost, GRID_PRESETS } from '../utils/url.utils';

interface TabBarProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onAddPane: () => void;
  onCloneTabIntoNewSession: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onResetTabSession: (tabId: string) => void;
  onRenameTab: (tabId: string, title: string) => void;
  onResetGridSplit: () => void;
  onApplyPreset: (urls: Record<string, string>) => void;
  onOpenSettings: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onAddPane,
  onCloneTabIntoNewSession,
  onCloseTab,
  onResetTabSession,
  onRenameTab,
  onResetGridSplit,
  onApplyPreset,
  onOpenSettings,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [sessionToast, setSessionToast] = useState<string | null>(null);

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
    if (activeHosts.length === 0) return `${count} tela${count > 1 ? 's' : ''} livre${count > 1 ? 's' : ''}`;
    return `${activeHosts.length}/${count} ativa${count > 1 ? 's' : ''} • ${activeHosts[0]}`;
  };

  const currentWindowCount = activeTab?.paneOrder?.length || Object.keys(activeTab?.panes || {}).length || 1;

  return (
    <header className="h-[42px] bg-[#090A0C] border-b border-[#232832] flex items-center justify-between px-2 select-none shrink-0 z-30 relative">
      {/* Left: Brand Identity + Tab Strip */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar pr-2">
        <div
          className="flex items-center gap-2 px-2.5 py-1 bg-[#111317] border border-[#232832] rounded-[2px] shrink-0"
          title="4Nav — Navegador Multi-Sessão Otimizado para Jogos Idle"
        >
          <SquaresFour size={16} weight="bold" className="text-[#10B981]" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#F3F4F6]">
            4NAV
          </span>
          <span className="text-[9px] font-mono px-1 py-0.2 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded-[2px]">
            IDLE HUB
          </span>
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
                className={`group relative flex items-center gap-2 px-2.5 h-[32px] min-w-[165px] max-w-[235px] rounded-[2px] border border-[#232832] border-t-2 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#181B21] text-[#F3F4F6] shadow-sm'
                    : 'bg-[#111317] text-[#9CA3AF] hover:bg-[#15181F] hover:text-[#F3F4F6]'
                }`}
              >
                {/* Isolated Container Indicator Dot & Number */}
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-[2px] shrink-0"
                  style={{
                    backgroundColor: `${tab.containerColor}1F`,
                    color: tab.containerColor,
                    border: `1px solid ${tab.containerColor}4D`,
                  }}
                  title={`Sessão Isolada #${tab.sessionNumber} (${tab.sessionId}) — Logins e cookies 100% isolados das outras abas`}
                >
                  <ShieldCheck size={11} weight="fill" />#{tab.sessionNumber}
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
                      className="bg-[#090A0C] text-[#F3F4F6] text-[11px] px-1 py-0 border border-[#10B981] rounded-[2px] outline-none w-full"
                    />
                  ) : (
                    <>
                      <span className="text-[11px] font-medium truncate">{tab.title}</span>
                      <span className="text-[9px] font-mono text-[#6B7280] truncate">
                        {getTabSubLabel(tab)}
                      </span>
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
                  className="p-1 rounded-[2px] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#232832] transition-colors shrink-0"
                >
                  <X size={12} weight="bold" />
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
            className="flex items-center gap-1.5 px-2.5 h-[32px] bg-[#111317] hover:bg-[#181B21] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">Nova Aba</span>
          </button>
        </div>
      </div>

      {/* Right: Actions, Add Window, Presets & Settings */}
      <div className="flex items-center gap-1.5 shrink-0">
        {sessionToast && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-[11px] font-mono rounded-[2px]">
            <ShieldCheck size={13} weight="fill" />
            <span>{sessionToast}</span>
          </div>
        )}

        {/* "+ Adicionar Janela" Button */}
        <button
          type="button"
          onClick={() => {
            onAddPane();
            showToast('Nova janela de jogo adicionada à aba!');
          }}
          title="Adicionar Tela (+ Janela) — Adiciona mais uma tela na mesma aba para rodar outro jogo idle"
          className="flex items-center gap-1.5 px-2.5 h-[28px] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 rounded-[2px] text-[11px] font-bold transition-colors cursor-pointer"
        >
          <Plus size={13} weight="bold" />
          <span>+ Janela</span>
          <span className="text-[9px] font-mono px-1 py-0.2 bg-[#10B981]/20 rounded-[2px]">
            {currentWindowCount}
          </span>
        </button>

        {/* Clone Current Tab into a Fresh Unauthenticated Session */}
        {activeTab && (
          <button
            type="button"
            onClick={() => {
              onCloneTabIntoNewSession(activeTab.id);
              showToast('Aba clonada em uma nova sessão isolada (logins independentes)!');
            }}
            title="Duplicar as páginas desta aba em uma NOVA Sessão Isolada (logins separados)"
            className="hidden xl:flex items-center gap-1 px-2 h-[28px] bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[11px] transition-colors cursor-pointer"
          >
            <CopySimple size={13} className="text-[#06B6D4]" />
            <span>Clonar Sessão</span>
          </button>
        )}

        {/* Clear / Reset Current Tab Cookies & Login Session */}
        {activeTab && (
          <button
            type="button"
            onClick={() => {
              onResetTabSession(activeTab.id);
              showToast(`Cookies e logins da Sessão #${activeTab.sessionNumber} foram limpos!`);
            }}
            title="Limpar cookies, cache e logins apenas desta aba"
            className="hidden xl:flex items-center gap-1 px-2 h-[28px] bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[11px] transition-colors cursor-pointer"
          >
            <Broom size={13} className="text-[#F59E0B]" />
            <span>Limpar Sessão</span>
          </button>
        )}

        {/* Equalize 50x50 Grid Button */}
        {currentWindowCount >= 2 && (
          <button
            type="button"
            onClick={onResetGridSplit}
            title="Restaurar proporção 50% × 50% dos quadrantes"
            className="hidden lg:flex items-center gap-1 px-2 h-[28px] bg-[#111317] hover:bg-[#181B21] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[11px] transition-colors cursor-pointer"
          >
            <ArrowsInLineHorizontal size={13} />
            <span>50×50</span>
          </button>
        )}

        {/* Presets Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetMenuOpen((prev) => !prev)}
            title="Carregar presets de jogos e telas"
            className="flex items-center gap-1 px-2.5 h-[28px] bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer"
          >
            <SquaresFour size={13} className="text-[#10B981]" />
            <span className="hidden md:inline">Presets</span>
          </button>

          {presetMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPresetMenuOpen(false)}
              />
              <div className="absolute right-0 top-[34px] w-[290px] bg-[#111317] border border-[#232832] rounded-[2px] shadow-2xl p-1.5 z-50">
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
                    className="w-full text-left px-2.5 py-2 hover:bg-[#181B21] rounded-[2px] transition-colors flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="text-[12px] font-medium text-[#F3F4F6]">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF]">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Configurações (Otimização para Jogos Idle e Atalhos de Teclado)"
          className="flex items-center gap-1.5 px-2.5 h-[28px] bg-[#111317] hover:bg-[#181B21] text-[#F3F4F6] border border-[#232832] hover:border-[#10B981]/50 rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer"
        >
          <Gear size={14} className="text-[#10B981]" weight="bold" />
          <span className="hidden sm:inline">Configurações</span>
        </button>
      </div>
    </header>
  );
};
