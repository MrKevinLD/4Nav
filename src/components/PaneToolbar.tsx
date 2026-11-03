import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ArrowLeft,
  ArrowRight,
  ArrowClockwise,
  House,
  LockKey,
  Globe,
  CornersOut,
  CornersIn,
  ShieldCheck,
  PlugsConnected,
  ArrowSquareOut,
  SpeakerHigh,
  SpeakerSlash,
  X,
} from '@phosphor-icons/react';
import type { PaneState } from '../types/browser.types';
import { useMobileView } from '../hooks/useMobileView';

interface PaneToolbarProps {
  pane: PaneState;
  tabSessionNumber: number;
  containerColor: string;
  isActive: boolean;
  isMaximized: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  shortcutLabel?: string;
  canClose?: boolean;
  onNavigate: (input: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onToggleProxy: () => void;
  onToggleSubPaneIsolation: () => void;
  onToggleMute: () => void;
  onToggleMaximize: () => void;
  onOpenExternalPopup: () => void;
  onFocusPane: () => void;
  onClosePane?: () => void;
}

export const PaneToolbar: React.FC<PaneToolbarProps> = ({
  pane,
  tabSessionNumber,
  containerColor,
  isActive,
  isMaximized,
  canGoBack,
  canGoForward,
  shortcutLabel,
  canClose,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onToggleProxy,
  onToggleSubPaneIsolation,
  onToggleMute,
  onToggleMaximize,
  onOpenExternalPopup,
  onFocusPane,
  onClosePane,
}) => {
  const { isMobile } = useMobileView();
  const [draftUrl, setDraftUrl] = useState(pane.inputUrl);

  useEffect(() => {
    setDraftUrl(pane.inputUrl);
  }, [pane.inputUrl, pane.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFocusPane();
    onNavigate(draftUrl);
  };

  const isHttps = pane.url.startsWith('https://');
  const isBlank = !pane.url || pane.url === 'about:blank';
  const isElectron = Boolean(typeof window !== 'undefined' && window.electronAPI?.isElectron);

  return (
    <div
      onClick={onFocusPane}
      className={`${
        isMobile ? 'h-[26px] px-1 gap-1' : 'h-[34px] px-1.5 gap-1.5'
      } flex items-center border-b transition-colors select-none shrink-0 ${
        isActive
          ? 'bg-[#181B21] border-[#232832]'
          : 'bg-[#111317] border-[#232832]/80'
      }`}
    >
      {/* Quadrant Position & Session Badge */}
      <div
        className={`flex items-center ${
          isMobile ? 'gap-1 px-1 h-[20px] text-[9px]' : 'gap-1.5 px-2 h-[24px] text-[10px]'
        } rounded-[2px] font-mono font-bold shrink-0`}
        style={{
          backgroundColor: isActive ? `${containerColor}22` : '#090A0C',
          color: isActive ? containerColor : '#9CA3AF',
          border: `1px solid ${isActive ? `${containerColor}55` : '#232832'}`,
        }}
        title={`Janela ${pane.quadrantNumber} (${pane.positionLabel})${
          shortcutLabel ? ` • Atalho para maximizar: ${shortcutLabel}` : ''
        } • Sessão #${tabSessionNumber}${
          pane.isolateSubPane ? ' (Sub-sessão exclusiva desta tela)' : ''
        }`}
      >
        <span>J{pane.quadrantNumber}</span>
        {shortcutLabel && !isMobile && (
          <span className="hidden sm:inline text-[9px] px-1 py-0 bg-black/40 text-[#F3F4F6] rounded-[2px]">
            {shortcutLabel}
          </span>
        )}
        {pane.isolateSubPane && (
          <span className="text-[9px] px-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded-[2px]">
            ISO
          </span>
        )}
      </div>

      {/* Navigation Buttons: Back, Forward, Reload, Home */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          disabled={!canGoBack}
          title={`Voltar (Quadrante ${pane.quadrantNumber})`}
          aria-label={`Voltar no quadrante ${pane.quadrantNumber}`}
          className={`${
            isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
          } flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer`}
        >
          <ArrowLeft size={isMobile ? 11 : 13} weight="bold" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onForward();
          }}
          disabled={!canGoForward}
          title={`Avançar (Quadrante ${pane.quadrantNumber})`}
          aria-label={`Avançar no quadrante ${pane.quadrantNumber}`}
          className={`${
            isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
          } flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer`}
        >
          <ArrowRight size={isMobile ? 11 : 13} weight="bold" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReload();
          }}
          title={`Recarregar página (Quadrante ${pane.quadrantNumber})`}
          aria-label={`Recarregar quadrante ${pane.quadrantNumber}`}
          className={`${
            isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
          } flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] transition-colors cursor-pointer`}
        >
          <ArrowClockwise
            size={isMobile ? 11 : 13}
            weight="bold"
            className={pane.isLoading ? 'animate-spin text-[#10B981]' : ''}
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHome();
          }}
          title={`Painel Inicial / Speed Dial (Quadrante ${pane.quadrantNumber})`}
          aria-label={`Início do quadrante ${pane.quadrantNumber}`}
          className={`${
            isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
          } flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] transition-colors cursor-pointer`}
        >
          <House size={isMobile ? 11 : 13} weight="bold" />
        </button>
      </div>

      {/* Individual Address / URL Form */}
      <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex items-center">
        <div
          className={`w-full ${
            isMobile ? 'h-[20px] px-1.5 gap-1' : 'h-[24px] px-2 gap-1.5'
          } flex items-center bg-[#090A0C] border rounded-[2px] transition-colors ${
            isActive
              ? 'border-[#232832] focus-within:border-[#10B981]'
              : 'border-[#232832]/70 focus-within:border-[#10B981]'
          }`}
        >
          {isBlank ? (
            <Globe size={isMobile ? 10 : 12} className="text-[#6B7280] shrink-0" />
          ) : isHttps ? (
            <LockKey size={isMobile ? 10 : 12} weight="fill" className="text-[#10B981] shrink-0" />
          ) : (
            <Globe size={isMobile ? 10 : 12} className="text-[#F59E0B] shrink-0" />
          )}

          <input
            type="text"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onFocus={(e) => {
              onFocusPane();
              e.currentTarget.select();
            }}
            placeholder={`URL J${pane.quadrantNumber}...`}
            aria-label={`Endereço URL do quadrante ${pane.quadrantNumber}`}
            className={`w-full bg-transparent ${
              isMobile ? 'text-[10px]' : 'text-[11px]'
            } font-mono text-[#F3F4F6] placeholder-[#6B7280] outline-none truncate`}
          />

          {pane.useProxy && (
            <span
              className="text-[9px] font-mono px-1 py-0.2 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded-[2px] shrink-0"
              title="Modo Proxy de Sessão Isolada ativo"
            >
              PROXY
            </span>
          )}
        </div>
      </form>

      {/* Right Quadrant Utility Controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Toggle Sub-Pane Exclusive Session Isolation */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSubPaneIsolation();
          }}
          title={
            pane.isolateSubPane
              ? 'Sub-sessão exclusiva ativa. Clique para voltar à sessão da aba.'
              : 'Isolar esta tela em sub-sessão própria (permite contas diferentes)'
          }
          aria-label={`Alternar isolamento de sub-sessão no quadrante ${pane.quadrantNumber}`}
          className={`${
            isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
          } flex items-center justify-center rounded-[2px] transition-colors cursor-pointer ${
            pane.isolateSubPane
              ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832]'
          }`}
        >
          <ShieldCheck size={isMobile ? 11 : 13} weight={pane.isolateSubPane ? 'fill' : 'regular'} />
        </button>

        {/* Toggle X-Frame-Options Bypass Proxy (only needed in Web Preview mode) */}
        {!isElectron && !Capacitor.isNativePlatform() && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleProxy();
            }}
            title={
              pane.useProxy
                ? 'Desativar Proxy Local de Contorno X-Frame-Options'
                : 'Ativar Proxy Local de Sessão'
            }
            aria-label={`Alternar proxy no quadrante ${pane.quadrantNumber}`}
            className={`${
              isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
            } flex items-center justify-center rounded-[2px] transition-colors cursor-pointer ${
              pane.useProxy
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832]'
            }`}
          >
            <PlugsConnected size={isMobile ? 11 : 13} weight={pane.useProxy ? 'fill' : 'regular'} />
          </button>
        )}

        {/* Mute / Unmute Audio (Desktop only to save mobile space) */}
        {!isMobile && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            title={pane.isMuted ? 'Ativar som deste quadrante' : 'Silenciar este quadrante'}
            aria-label={`Alternar som no quadrante ${pane.quadrantNumber}`}
            className="w-[24px] h-[24px] flex items-center justify-center rounded-[2px] transition-colors cursor-pointer text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832]"
          >
            {pane.isMuted ? <SpeakerSlash size={13} /> : <SpeakerHigh size={13} />}
          </button>
        )}

        {/* Open in External / Dedicated Popup Window (Desktop only to save mobile space) */}
        {!isMobile && !isBlank && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenExternalPopup();
            }}
            title="Abrir URL em janela pop-up auxiliar"
            aria-label={`Abrir URL externa do quadrante ${pane.quadrantNumber}`}
            className="w-[24px] h-[24px] flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] transition-colors cursor-pointer"
          >
            <ArrowSquareOut size={13} />
          </button>
        )}

        {/* Maximize / Restore Quadrant */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMaximize();
          }}
          title={
            isMaximized
              ? 'Restaurar visualização em grade'
              : `Maximizar Janela ${pane.quadrantNumber}`
          }
          aria-label={
            isMaximized
              ? `Restaurar janela ${pane.quadrantNumber}`
              : `Maximizar janela ${pane.quadrantNumber}`
          }
          className={`${
            isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
          } flex items-center justify-center rounded-[2px] transition-colors cursor-pointer ${
            isMaximized
              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832]'
          }`}
        >
          {isMaximized ? (
            <CornersIn size={isMobile ? 11 : 13} weight="bold" />
          ) : (
            <CornersOut size={isMobile ? 11 : 13} />
          )}
        </button>

        {/* Close Window Button (only if multiple windows exist) */}
        {canClose && onClosePane && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClosePane();
            }}
            title={`Fechar Janela ${pane.quadrantNumber}`}
            aria-label={`Fechar Janela ${pane.quadrantNumber}`}
            className={`${
              isMobile ? 'w-[20px] h-[20px]' : 'w-[24px] h-[24px]'
            } flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#232832] transition-colors cursor-pointer`}
          >
            <X size={isMobile ? 11 : 13} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
};

