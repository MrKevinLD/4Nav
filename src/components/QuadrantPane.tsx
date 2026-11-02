import React, { useEffect, useRef, useState } from 'react';
import {
  WarningOctagon,
  PlugsConnected,
  ArrowSquareOut,
  ArrowClockwise,
  ShieldCheck,
} from '@phosphor-icons/react';
import type { PaneState } from '../types/browser.types';
import { getDisplayHost, isKnownFrameRestrictedDomain } from '../utils/url.utils';
import { PaneToolbar } from './PaneToolbar';
import { SpeedDial } from './SpeedDial';

interface QuadrantPaneProps {
  pane: PaneState;
  tabSessionNumber: number;
  tabSessionId: string;
  containerColor: string;
  isActive: boolean;
  isMaximized: boolean;
  shortcutLabel?: string;
  canClose?: boolean;
  enableLiteMode?: boolean;
  muteBackgroundPanes?: boolean;
  defaultZoomLevel?: number;
  onFocusPane: () => void;
  onNavigate: (rawInput: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onUpdatePane: (updater: (p: PaneState) => PaneState) => void;
  onToggleMaximize: () => void;
  onClosePane?: () => void;
}

interface ElectronWebviewElement extends HTMLElement {
  src: string;
  partition: string;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  setAudioMuted: (muted: boolean) => void;
  setZoomFactor?: (factor: number) => void;
  insertCSS?: (css: string) => Promise<string>;
  getURL: () => string;
  getTitle: () => string;
}

export const QuadrantPane: React.FC<QuadrantPaneProps> = ({
  pane,
  tabSessionNumber,
  tabSessionId,
  containerColor,
  isActive,
  isMaximized,
  shortcutLabel,
  canClose,
  enableLiteMode,
  muteBackgroundPanes,
  defaultZoomLevel = 1,
  onFocusPane,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onUpdatePane,
  onToggleMaximize,
  onClosePane,
}) => {
  const isElectron = Boolean(typeof window !== 'undefined' && window.electronAPI?.isElectron);
  const webviewRef = useRef<ElectronWebviewElement | null>(null);
  const [nativeCanBack, setNativeCanBack] = useState(false);
  const [nativeCanForward, setNativeCanForward] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  // Compute effective session partition:
  // By default, all 4 quadrants in Tab N share Tab N's isolated session (`tabSessionId`),
  // while Tab N+1 has a completely separate session. If `isolateSubPane` is toggled on,
  // even this individual quadrant gets its own sub-partition!
  const effectiveSessionKey = pane.isolateSubPane
    ? `${tabSessionId}-${pane.id}`
    : tabSessionId;
  const electronPartition = `persist:${effectiveSessionKey}`;

  // Reset warning dismissal when URL changes
  useEffect(() => {
    setDismissedWarning(false);
  }, [pane.url, pane.reloadCounter]);

  // In Web Browser mode (non-Electron), inspect if target URL blocks framing via X-Frame-Options / CSP
  useEffect(() => {
    if (isElectron) return;
    if (!pane.url || pane.url === 'about:blank' || pane.useProxy) {
      onUpdatePane((p) => (p.frameBlockedReason ? { ...p, frameBlockedReason: null } : p));
      return;
    }

    let cancelled = false;

    if (isKnownFrameRestrictedDomain(pane.url)) {
      onUpdatePane((p) => ({
        ...p,
        frameBlockedReason:
          'Este domínio envia cabeçalhos de segurança (X-Frame-Options / CSP) que bloqueiam iframes comuns no navegador web.',
      }));
    }

    fetch(`/api/check-frame?url=${encodeURIComponent(pane.url)}`)
      .then((r) => r.json())
      .then((data: { blocked?: boolean; reason?: string }) => {
        if (cancelled) return;
        if (data.blocked) {
          onUpdatePane((p) => ({
            ...p,
            frameBlockedReason: data.reason || 'X-Frame-Options: SAMEORIGIN / DENY',
            isLoading: false,
          }));
        }
      })
      .catch(() => {
        // Ignore network check error
      });

    return () => {
      cancelled = true;
    };
  }, [pane.url, pane.useProxy, pane.reloadCounter, isElectron, onUpdatePane]);

  // Attach Electron <webview> event listeners when running in Desktop runtime
  useEffect(() => {
    if (!isElectron) return;
    const el = webviewRef.current;
    if (!el || pane.url === 'about:blank') return;

    const handleStartLoading = () => {
      onUpdatePane((p) => ({ ...p, isLoading: true, frameBlockedReason: null }));
    };

    const handleStopLoading = () => {
      try {
        setNativeCanBack(el.canGoBack());
        setNativeCanForward(el.canGoForward());
      } catch {
        // Ignore if webview not ready
      }
      onUpdatePane((p) => ({ ...p, isLoading: false }));
    };

    const handleDidNavigate = (e: Event) => {
      const navEvent = e as Event & { url?: string };
      const currentUrl = navEvent.url || el.getURL?.() || pane.url;
      if (currentUrl && currentUrl !== 'about:blank') {
        onUpdatePane((p) => ({
          ...p,
          url: currentUrl,
          inputUrl: currentUrl,
          title: getDisplayHost(currentUrl),
        }));
      }
    };

    const handleFailLoad = (e: Event) => {
      const failEvent = e as Event & {
        errorCode?: number;
        errorDescription?: string;
        isMainFrame?: boolean;
      };
      // Ignore aborted loads (-3)
      if (failEvent.errorCode === -3 || failEvent.isMainFrame === false) return;
      onUpdatePane((p) => ({
        ...p,
        isLoading: false,
        frameBlockedReason: `Falha ao carregar (${failEvent.errorDescription || 'Erro de rede'})`,
      }));
    };

    el.addEventListener('did-start-loading', handleStartLoading);
    el.addEventListener('did-stop-loading', handleStopLoading);
    el.addEventListener('did-navigate', handleDidNavigate);
    el.addEventListener('did-navigate-in-page', handleDidNavigate);
    el.addEventListener('did-fail-load', handleFailLoad);

    return () => {
      el.removeEventListener('did-start-loading', handleStartLoading);
      el.removeEventListener('did-stop-loading', handleStopLoading);
      el.removeEventListener('did-navigate', handleDidNavigate);
      el.removeEventListener('did-navigate-in-page', handleDidNavigate);
      el.removeEventListener('did-fail-load', handleFailLoad);
    };
  }, [isElectron, pane.url, pane.reloadCounter, effectiveSessionKey, onUpdatePane]);

  // Sync audio mute state on Electron webview (including background auto-muting)
  useEffect(() => {
    if (!isElectron || !webviewRef.current) return;
    try {
      const shouldMute = pane.isMuted || Boolean(muteBackgroundPanes && !isActive);
      webviewRef.current.setAudioMuted(shouldMute);
    } catch {
      // Ignore if webview is not ready yet
    }
  }, [isElectron, pane.isMuted, muteBackgroundPanes, isActive]);

  // Apply lite mode CSS injection to reduce idle game CPU consumption
  useEffect(() => {
    if (!isElectron || !webviewRef.current || !enableLiteMode) return;
    try {
      webviewRef.current.insertCSS?.(`
        *, *::before, *::after {
          animation-duration: 0.001s !important;
          transition-duration: 0.001s !important;
        }
      `).catch(() => {});
    } catch {
      // Ignore
    }
  }, [isElectron, enableLiteMode, pane.reloadCounter, pane.url]);

  // Apply default or custom zoom factor
  useEffect(() => {
    if (!isElectron || !webviewRef.current) return;
    try {
      const targetZoom = (defaultZoomLevel || 1) * (pane.zoomLevel || 1);
      webviewRef.current.setZoomFactor?.(targetZoom);
    } catch {
      // Ignore
    }
  }, [isElectron, defaultZoomLevel, pane.zoomLevel]);

  const handleBack = () => {
    if (isElectron && webviewRef.current) {
      try {
        if (webviewRef.current.canGoBack()) {
          webviewRef.current.goBack();
          return;
        }
      } catch {
        // Fallback to state history
      }
    }
    onBack();
  };

  const handleForward = () => {
    if (isElectron && webviewRef.current) {
      try {
        if (webviewRef.current.canGoForward()) {
          webviewRef.current.goForward();
          return;
        }
      } catch {
        // Fallback to state history
      }
    }
    onForward();
  };

  const handleReload = () => {
    if (isElectron && webviewRef.current && pane.url !== 'about:blank') {
      try {
        webviewRef.current.reload();
        return;
      } catch {
        // Fallback
      }
    }
    onReload();
  };

  const handleOpenExternalPopup = () => {
    if (!pane.url || pane.url === 'about:blank') return;
    const width = 980;
    const height = 720;
    const left = Math.max(0, Math.round((window.screen.width - width) / 2));
    const top = Math.max(0, Math.round((window.screen.height - height) / 2));
    window.open(
      pane.url,
      `quadnav_${effectiveSessionKey}_${pane.id}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes`
    );
  };

  const canGoBack = isElectron
    ? nativeCanBack || pane.historyIndex > 0
    : pane.historyIndex > 0;
  const canGoForward = isElectron
    ? nativeCanForward || pane.historyIndex < pane.history.length - 1
    : pane.historyIndex < pane.history.length - 1;

  const isBlank = !pane.url || pane.url === 'about:blank';

  // Compute effective iframe src when running in Web Browser mode
  const iframeSrc = pane.useProxy
    ? `/api/proxy?session=${encodeURIComponent(effectiveSessionKey)}&url=${encodeURIComponent(
        pane.url
      )}`
    : pane.url;

  const showXfoBanner =
    !isElectron && !isBlank && Boolean(pane.frameBlockedReason) && !pane.useProxy && !dismissedWarning;

  return (
    <section
      onMouseDown={onFocusPane}
      aria-label={`Quadrante ${pane.quadrantNumber} - ${pane.positionLabel}`}
      className={`relative w-full h-full flex flex-col bg-[#090A0C] overflow-hidden border transition-colors ${
        isActive ? 'border-[#10B981]' : 'border-[#232832]'
      }`}
    >
      {/* Quadrant Individual Mini Toolbar */}
      <PaneToolbar
        pane={pane}
        tabSessionNumber={tabSessionNumber}
        containerColor={containerColor}
        isActive={isActive}
        isMaximized={isMaximized}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        shortcutLabel={shortcutLabel}
        canClose={canClose}
        onNavigate={onNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onHome={() => onNavigate('about:blank')}
        onToggleProxy={() =>
          onUpdatePane((p) => ({
            ...p,
            useProxy: !p.useProxy,
            frameBlockedReason: null,
            isLoading: true,
          }))
        }
        onToggleSubPaneIsolation={() =>
          onUpdatePane((p) => ({
            ...p,
            isolateSubPane: !p.isolateSubPane,
            reloadCounter: p.reloadCounter + 1,
          }))
        }
        onToggleMute={() => onUpdatePane((p) => ({ ...p, isMuted: !p.isMuted }))}
        onToggleMaximize={onToggleMaximize}
        onOpenExternalPopup={handleOpenExternalPopup}
        onFocusPane={onFocusPane}
        onClosePane={onClosePane}
      />

      {/* Loading Progress Hairline */}
      {pane.isLoading && !isBlank && (
        <div className="h-[2px] w-full bg-[#111317] overflow-hidden shrink-0">
          <div className="h-full w-1/2 bg-[#10B981] animate-pulse" />
        </div>
      )}

      {/* Quadrant Content Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#090A0C]">
        {isBlank ? (
          <SpeedDial
            quadrantNumber={pane.quadrantNumber}
            positionLabel={pane.positionLabel}
            tabSessionNumber={tabSessionNumber}
            sessionId={effectiveSessionKey}
            containerColor={containerColor}
            isolateSubPane={pane.isolateSubPane}
            onNavigate={(targetUrl, enableProxy) => {
              if (enableProxy && !isElectron) {
                onUpdatePane((p) => ({ ...p, useProxy: true }));
              }
              onNavigate(targetUrl);
            }}
            onToggleSubPaneIsolation={() =>
              onUpdatePane((p) => ({
                ...p,
                isolateSubPane: !p.isolateSubPane,
              }))
            }
          />
        ) : isElectron ? (
          React.createElement('webview', {
            key: `${effectiveSessionKey}-${pane.reloadCounter}`,
            ref: webviewRef,
            src: pane.url,
            partition: electronPartition,
            allowpopups: 'true',
            className: 'w-full h-full border-0 bg-white',
          })
        ) : (
          <iframe
            key={`${effectiveSessionKey}-${pane.useProxy ? 'proxy' : 'direct'}-${pane.reloadCounter}`}
            src={iframeSrc}
            title={`Quadrante ${pane.quadrantNumber} (${pane.title})`}
            onLoad={() => onUpdatePane((p) => ({ ...p, isLoading: false }))}
            onError={() =>
              onUpdatePane((p) => ({
                ...p,
                isLoading: false,
                frameBlockedReason: 'Recusado pelo servidor remoto (X-Frame-Options)',
              }))
            }
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
            referrerPolicy="no-referrer"
            className="w-full h-full border-0 bg-white"
          />
        )}

        {/* Friendly X-Frame-Options / CSP Security Interceptor Overlay */}
        {showXfoBanner && (
          <div className="absolute inset-0 bg-[#090A0C]/95 flex items-center justify-center p-4 z-20">
            <div className="max-w-[420px] w-full bg-[#111317] border border-[#232832] rounded-[2px] p-4 shadow-2xl flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] rounded-[2px] shrink-0">
                  <WarningOctagon size={20} weight="fill" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B]">
                    Proteção de Frame Detectada ({getDisplayHost(pane.url)})
                  </span>
                  <h3 className="text-[13px] font-semibold text-[#F3F4F6]">
                    Este site restringe exibição em Iframe padrão
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Motivo técnico:{' '}
                    <code className="font-mono text-[#F3F4F6] bg-[#090A0C] px-1 py-0.5 rounded-[2px]">
                      {pane.frameBlockedReason}
                    </code>
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#232832] rounded-[2px] text-[11px] text-[#9CA3AF] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#10B981] shrink-0" />
                <span>
                  Você pode ativar o <strong className="text-[#F3F4F6]">Proxy de Sessão Isolada</strong>{' '}
                  para carregar dentro deste quadrante com cookies exclusivos da{' '}
                  <strong className="text-[#10B981]">Sessão #{tabSessionNumber}</strong>, ou usar o modo
                  Desktop Electron (<code className="text-[#F3F4F6]">npm run desktop</code>).
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePane((p) => ({
                      ...p,
                      useProxy: true,
                      frameBlockedReason: null,
                      isLoading: true,
                      reloadCounter: p.reloadCounter + 1,
                    }))
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-[#090A0C] font-semibold text-[11px] rounded-[2px] transition-colors cursor-pointer"
                >
                  <PlugsConnected size={14} weight="bold" />
                  <span>Ativar Proxy Isolado no Q{pane.quadrantNumber}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternalPopup}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#181B21] hover:bg-[#232832] text-[#F3F4F6] border border-[#232832] text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer"
                >
                  <ArrowSquareOut size={14} />
                  <span>Janela Pop-up</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDismissedWarning(true)}
                  title="Ocultar aviso e manter iframe direto"
                  className="flex items-center justify-center gap-1 px-2.5 py-2 bg-transparent hover:bg-[#181B21] text-[#9CA3AF] hover:text-[#F3F4F6] text-[11px] rounded-[2px] transition-colors cursor-pointer"
                >
                  <ArrowClockwise size={13} />
                  <span>Ignorar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

