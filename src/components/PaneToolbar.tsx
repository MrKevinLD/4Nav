import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ArrowLeft,
  ArrowRight,
  ArrowClockwise,
  House,
  Globe,
  CornersOut,
  CornersIn,
  ShieldCheck,
  ShieldWarning,
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
  const [showHttpWarning, setShowHttpWarning] = useState(false);

  useEffect(() => {
    setDraftUrl(pane.inputUrl);
  }, [pane.inputUrl, pane.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFocusPane();
    onNavigate(draftUrl);
  };

  const isHttps = pane.url.startsWith('https://');
  const isHttp = pane.url.startsWith('http://') && !pane.url.startsWith('http://localhost') && !pane.url.startsWith('http://127.0.0.1');
  const isBlank = !pane.url || pane.url === 'about:blank' || pane.url.startsWith('localhost') || pane.url.startsWith('http://localhost') || pane.url.startsWith('http://127.0.0.1');
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
            className={pane.isLoading ? 'animate-spin text-[#3B82F6]' : ''}
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
              ? 'border-[#232832] focus-within:border-[#3B82F6]'
              : 'border-[#232832]/70 focus-within:border-[#3B82F6]'
          }`}
        >
          {/* Dynamic Protocol & Navigation Shield */}
          {isBlank ? (
            <span title="🌐 Página em branco ou endereço local" className="flex items-center shrink-0">
              <Globe
                size={isMobile ? 10 : 12}
                className="text-[#9CA3AF]"
              />
            </span>
          ) : isHttps ? (
            <span title="🔒 Verde Esmeralda: Conexão segura e criptografada via SSL/TLS (HTTPS)" className="flex items-center shrink-0">
              <ShieldCheck
                size={isMobile ? 11 : 13}
                weight="fill"
                className="text-emerald-400"
              />
            </span>
          ) : isHttp ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowHttpWarning(true);
              }}
              title="⚠️ Vermelho Pulsante: Conexão aberta e sem criptografia (HTTP). Clique para ver o alerta!"
              className="shrink-0 p-0 m-0 border-none bg-transparent cursor-pointer flex items-center"
            >
              <ShieldWarning
                size={isMobile ? 11 : 13}
                weight="fill"
                className="text-[#EF4444] animate-pulse"
              />
            </button>
          ) : (
            <span title="🌐 Conexão de protocolo genérico" className="flex items-center shrink-0">
              <Globe
                size={isMobile ? 10 : 12}
                className="text-[#9CA3AF]"
              />
            </span>
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
              className="text-[9px] font-mono px-1 py-0.2 bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 rounded-[2px] shrink-0"
              title="Modo Proxy de Sessão Isolada ativo"
            >
              PROXY
            </span>
          )}
        </div>
      </form>

      {/* HTTP Insecure Connection Warning Popover */}
      {showHttpWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-2xs"
          onClick={(e) => {
            e.stopPropagation();
            setShowHttpWarning(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-[#161214] border border-[#EF4444]/50 rounded-[4px] p-4 shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-[#EF4444]">
              <ShieldWarning size={22} weight="bold" />
              <h4 className="font-bold text-sm text-[#F3F4F6]">
                Conexão Não Criptografada (HTTP)
              </h4>
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Esta página web está utilizando o protocolo <strong className="text-[#EF4444]">HTTP aberto</strong>, sem criptografia SSL/TLS.
            </p>
            <div className="p-2.5 bg-[#2B1518] border border-[#521C24] rounded-[3px] text-[11px] text-[#FCA5A5] leading-normal">
              ⚠️ <strong>Aviso de Segurança:</strong> Não insira senhas, logins, chaves de acesso ou dados pessoais nesta página. Informações transmitidas em HTTP podem ser interceptadas.
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHttpWarning(false)}
                className="px-3 py-1.5 bg-[#232832] hover:bg-[#323846] text-[#F3F4F6] text-xs font-medium rounded-[3px] transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

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
                ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40'
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
              ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40'
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

