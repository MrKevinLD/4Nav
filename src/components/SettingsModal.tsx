import React, { useState } from 'react';
import {
  X,
  Lightning,
  Keyboard,
  SlidersHorizontal,
  Broom,
  Check,
  SpeakerSlash,
  GameController,
  Monitor,
  Cpu,
  Sun,
  DeviceMobile,
  ArrowsInSimple,
  ArrowCounterClockwise,
  Pulse,
} from '@phosphor-icons/react';
import type { AppSettings } from '../types/browser.types';
import { useMobileView } from '../hooks/useMobileView';
import { Capacitor } from '@capacitor/core';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onSetModifierKey: (mod: 'Alt' | 'Ctrl' | 'Shift') => void;
  onSetShortcut: (windowIndex: number, shortcut: string) => void;
  onResetSettings: () => void;
  onClearRamCache: () => Promise<void> | void;
}

type SettingsTab = 'performance' | 'shortcuts' | 'windows';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onSetModifierKey,
  onSetShortcut,
  onResetSettings,
  onClearRamCache,
}) => {
  const { isMobile } = useMobileView();
  const showShortcutsTab = !Capacitor.isNativePlatform() && !isMobile;
  const [activeTab, setActiveTab] = useState<SettingsTab>('performance');
  const effectiveTab = !showShortcutsTab && activeTab === 'shortcuts' ? 'performance' : activeTab;
  const [ramCleanedToast, setRamCleanedToast] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [recordedKey, setRecordedKey] = useState('');
  const [systemLogs, setSystemLogs] = useState<string[] | null>(null);

  if (!isOpen) return null;

  const handleLoadLogs = () => {
    try {
      const bridge = (window as any).AndroidBridge;
      if (bridge && typeof bridge.getRecentLogs === 'function') {
        const raw = bridge.getRecentLogs();
        const parsed = JSON.parse(raw);
        setSystemLogs(Array.isArray(parsed) ? parsed : [String(parsed)]);
      } else {
        setSystemLogs(['[Info] AndroidBridge não disponível nesta plataforma (modo web).']);
      }
    } catch (e: any) {
      setSystemLogs([`Erro ao obter logs: ${e.message}`]);
    }
  };

  const handleCleanRam = async () => {
    try {
      await onClearRamCache();
      setRamCleanedToast(true);
      setTimeout(() => setRamCleanedToast(false), 3000);
    } catch {
      // Ignore
    }
  };

  const handleKeyRecording = (e: React.KeyboardEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingIndex(null);
      return;
    }

    const parts: string[] = [];
    if (e.altKey) parts.push('Alt');
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');

    const keyName = e.key.toUpperCase();
    if (!['ALT', 'CONTROL', 'SHIFT'].includes(keyName)) {
      parts.push(keyName);
      const combo = parts.join('+');
      onSetShortcut(index, combo);
      setEditingIndex(null);
    } else {
      setRecordedKey(parts.join('+') + '+...');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-black/75 backdrop-blur-[2px]">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-[#111317] border border-[#232832] rounded-[4px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-[52px] px-5 bg-[#090A0C] border-b border-[#232832] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <SlidersHorizontal size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#F3F4F6]">
                Configurações do 4Nav
              </h2>
              <p className="text-[10px] text-[#9CA3AF]">
                Otimização para jogos idle, múltiplas contas e atalhos rápidos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            className="p-1.5 text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#181B21] rounded-[2px] transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="h-[40px] px-5 bg-[#0D0F12] border-b border-[#232832] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-[#181B21] text-[#10B981] border border-[#10B981]/40'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#15181F]'
            }`}
          >
            <Lightning size={14} weight={effectiveTab === 'performance' ? 'fill' : 'regular'} />
            <span>Otimização & Jogos Idle</span>
          </button>

          {showShortcutsTab && (
            <button
              type="button"
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer ${
                effectiveTab === 'shortcuts'
                  ? 'bg-[#181B21] text-[#10B981] border border-[#10B981]/40'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#15181F]'
              }`}
            >
              <Keyboard size={14} weight={effectiveTab === 'shortcuts' ? 'fill' : 'regular'} />
              <span>Atalhos de Maximizar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer ${
              effectiveTab === 'windows'
                ? 'bg-[#181B21] text-[#10B981] border border-[#10B981]/40'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#15181F]'
            }`}
          >
            <GameController size={14} weight={effectiveTab === 'windows' ? 'fill' : 'regular'} />
            <span>Telas & Inicialização</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {/* TAB 1: OTIMIZAÇÃO & PERFORMANCE IDLE */}
          {effectiveTab === 'performance' && (
            <div className="space-y-4">
              {/* Anti-Bloqueio / Manter Tela Sempre Ligada */}
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sun size={16} className="text-[#10B981]" weight="bold" />
                    <span className="text-[12px] font-bold text-[#F3F4F6]">
                      Manter Tela Sempre Ligada (Anti-Bloqueio / Wake Lock)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded-[2px]">
                      Essencial Mobile
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Impede o celular de desligar ou bloquear a tela enquanto o 4Nav estiver aberto. Permite que seus jogos idle continuem farmando em segundo plano sem você precisar tocar na tela.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.keepScreenAwake}
                    onChange={(e) => onUpdateSetting('keepScreenAwake', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#232832] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10B981]" />
                </label>
              </div>

              {/* Modo Economia de Bateria Mobile */}
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lightning size={16} className="text-[#F59E0B]" weight="bold" />
                    <span className="text-[12px] font-bold text-[#F3F4F6]">
                      Modo Economia de Bateria & Temperatura
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 rounded-[2px]">
                      Poupa Bateria
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Limita a taxa de quadros e reduz a intensidade de shaders gráficos. Ideal para evitar superaquecimento e estender a duração da bateria enquanto joga no smartphone.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.enableEcoBatteryMode}
                    onChange={(e) => onUpdateSetting('enableEcoBatteryMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#232832] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10B981]" />
                </label>
              </div>

              {/* Diagnóstico de Rede & Logs do Sistema */}
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[12px] font-bold text-[#F3F4F6] flex items-center gap-1.5">
                      <Pulse size={15} className="text-[#10B981]" weight="bold" />
                      Diagnóstico de Conexão & Logs Mobile
                    </span>
                    <p className="text-[11px] text-[#9CA3AF]">
                      Exibe em tempo real as interceptações do OkHttp, remoção de headers XFO/CSP e status da rede nativa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadLogs}
                    className="px-2.5 py-1.5 bg-[#232832] hover:bg-[#323846] text-[#F3F4F6] text-[11px] font-semibold rounded-[2px] cursor-pointer transition-colors shrink-0"
                  >
                    Ver Logs
                  </button>
                </div>

                {systemLogs && (
                  <div className="mt-1 p-2 bg-[#090A0C] border border-[#232832] rounded-[2px] max-h-40 overflow-y-auto space-y-1 font-mono text-[10px] text-[#9CA3AF]">
                    {systemLogs.length === 0 ? (
                      <p className="text-[#6B7280]">Nenhum registro no momento.</p>
                    ) : (
                      systemLogs.map((log, i) => (
                        <div key={i} className="leading-tight text-[#E5E7EB] border-b border-[#181B21] pb-0.5">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Modo Ultra Leve Global */}
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-[#10B981]" weight="bold" />
                    <span className="text-[12px] font-bold text-[#F3F4F6]">
                      Modo Ultra Leve (Economia de CPU/GPU)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded-[2px]">
                      Recomendado p/ 3+ Jogos
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Desativa efeitos gráficos supérfluos e reduz o custo computacional de transições CSS. Essencial para rodar múltiplos jogos idle simultâneos sem engasgar o processador.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.enableLiteMode}
                    onChange={(e) => onUpdateSetting('enableLiteMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#232832] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10B981]" />
                </label>
              </div>

              {/* Mutar Janelas em Segundo Plano */}
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SpeakerSlash size={16} className="text-[#F59E0B]" weight="bold" />
                    <span className="text-[12px] font-bold text-[#F3F4F6]">
                      Mutar Janelas em Segundo Plano
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Apenas a janela focada emite som. Jogos idle executando canais de áudio simultâneos podem consumir de 15% a 30% a mais de processamento.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.muteBackgroundPanes}
                    onChange={(e) => onUpdateSetting('muteBackgroundPanes', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#232832] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10B981]" />
                </label>
              </div>

              {/* Escala de Zoom */}
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-[#06B6D4]" weight="bold" />
                    <span className="text-[12px] font-bold text-[#F3F4F6]">
                      Escala de Zoom Econômica para Telas Menores
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Ajustar o zoom para 90% ou 80% diminui a área do buffer WebGL/Canvas do jogo, economizando VRAM e facilitando a visualização de múltiplas telas divididas.
                  </p>
                </div>
                <select
                  value={settings.defaultZoomLevel}
                  onChange={(e) => onUpdateSetting('defaultZoomLevel', Number(e.target.value))}
                  aria-label="Escala de Zoom Econômica"
                  className="bg-[#090A0C] text-[#F3F4F6] text-[11px] font-mono border border-[#232832] rounded-[2px] px-2 py-1.5 outline-none focus:border-[#10B981] shrink-0"
                >
                  <option value={1}>100% (Padrão)</option>
                  <option value={0.9}>90% (Recomendado)</option>
                  <option value={0.8}>80% (Econômico)</option>
                  <option value={0.75}>75% (Ultra Leve)</option>
                </select>
              </div>

              {/* Botão de Liberar Memória RAM */}
              <div className="p-4 bg-[#090A0C] border border-[#232832] rounded-[2px] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Broom size={16} className="text-[#10B981]" weight="bold" />
                    <span className="text-[12px] font-bold text-[#F3F4F6]">
                      Liberar Memória RAM & Cache
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF]">
                    Limpa caches estáticos e aciona o coletor de lixo para estabilizar o navegador após horas de farm/idle contínuo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCleanRam}
                  className="flex items-center gap-2 px-3 py-2 bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/40 rounded-[2px] text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                >
                  {ramCleanedToast ? (
                    <>
                      <Check size={14} weight="bold" />
                      <span>RAM Limpa!</span>
                    </>
                  ) : (
                    <>
                      <Broom size={14} weight="bold" />
                      <span>Limpar RAM Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ATALHOS PARA MAXIMIZAR JANELAS (Desktop apenas) */}
          {showShortcutsTab && effectiveTab === 'shortcuts' && (
            <div className="space-y-4">
              {isMobile && (
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-[2px] flex items-center gap-2.5 text-[#10B981]">
                  <DeviceMobile size={22} weight="bold" className="shrink-0" />
                  <p className="text-[11px] leading-relaxed text-[#F3F4F6]">
                    <strong>Modo Mobile Ativo:</strong> No celular não é necessário teclado! A alternância entre contas é feita com 1 toque nos botões inferiores (<code className="text-[#10B981]">J1</code>, <code className="text-[#10B981]">J2</code>...) ou pelo modo Dual Split. Os atalhos abaixo são para uso com teclado físico (Desktop ou OTG/Bluetooth).
                  </p>
                </div>
              )}
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard size={16} className="text-[#10B981]" weight="bold" />
                    <span className="text-[12px] font-bold text-[#F3F4F6]">
                      Tecla Modificadora Rápida
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['Alt', 'Ctrl', 'Shift'] as const).map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => onSetModifierKey(mod)}
                        className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-[2px] border transition-colors cursor-pointer ${
                          settings.modifierKey === mod
                            ? 'bg-[#10B981] text-[#090A0C] border-[#10B981]'
                            : 'bg-[#090A0C] text-[#9CA3AF] border-[#232832] hover:text-[#F3F4F6]'
                        }`}
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                  Pressione o atalho correspondente para maximizar instantaneamente aquela janela (expandindo para tela cheia para você clicar/jogar). Pressione o mesmo atalho novamente ou <strong className="text-[#F3F4F6]">ESC</strong> para retornar à grade de todas as janelas.
                </p>
              </div>

              {/* Lista de Janelas e Seus Atalhos */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
                  Atalhos de Janelas Individuais
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
                    const currentShortcut =
                      settings.maximizeShortcuts[index] || `${settings.modifierKey}+${index}`;
                    const isEditing = editingIndex === index;

                    return (
                      <div
                        key={index}
                        className="p-2.5 bg-[#181B21] border border-[#232832] rounded-[2px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-[2px] bg-[#090A0C] border border-[#232832] text-[10px] font-mono font-bold flex items-center justify-center text-[#10B981]">
                            {index}
                          </span>
                          <span className="text-[11px] font-medium text-[#F3F4F6]">
                            Janela {index}
                          </span>
                        </div>

                        {isEditing ? (
                          <div
                            onKeyDown={(e) => handleKeyRecording(e, index)}
                            tabIndex={0}
                            autoFocus
                            className="px-2 py-0.5 bg-[#090A0C] border border-[#10B981] text-[#10B981] text-[11px] font-mono font-bold rounded-[2px] outline-none cursor-pointer animate-pulse"
                          >
                            {recordedKey || 'Pressione teclas...'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#090A0C] border border-[#232832] text-[#F3F4F6] text-[11px] font-mono font-bold rounded-[2px]">
                              {currentShortcut}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIndex(index);
                                setRecordedKey('');
                              }}
                              title="Clique para gravar um atalho personalizado"
                              className="text-[10px] text-[#9CA3AF] hover:text-[#10B981] px-1 py-0.5 hover:bg-[#232832] rounded-[2px] transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-[#090A0C] border border-[#232832] rounded-[2px] flex items-center justify-between text-[11px] text-[#9CA3AF]">
                <div className="flex items-center gap-2">
                  <ArrowsInSimple size={15} className="text-[#06B6D4]" />
                  <span>Restaurar Grade Completa:</span>
                </div>
                <span className="font-mono font-bold text-[#F3F4F6] px-2 py-0.5 bg-[#181B21] border border-[#232832] rounded-[2px]">
                  ESC ou Repetir o Atalho
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: TELAS & INICIALIZAÇÃO */}
          {effectiveTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#181B21] border border-[#232832] rounded-[2px] space-y-2">
                <div className="flex items-center gap-2">
                  <GameController size={16} className="text-[#10B981]" weight="bold" />
                  <span className="text-[12px] font-bold text-[#F3F4F6]">
                    URL Padrão para Novas Janelas
                  </span>
                </div>
                <p className="text-[11px] text-[#9CA3AF]">
                  Quando você clicar em <strong className="text-[#10B981]">+ Adicionar Janela</strong>, esta página será aberta automaticamente na nova tela:
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={settings.defaultNewPaneUrl}
                    onChange={(e) => onUpdateSetting('defaultNewPaneUrl', e.target.value)}
                    placeholder="https://... ou about:blank"
                    aria-label="URL Padrão para Novas Janelas"
                    className="flex-1 bg-[#090A0C] border border-[#232832] focus:border-[#10B981] text-[#F3F4F6] text-[11px] font-mono px-2.5 py-1.5 rounded-[2px] outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#9CA3AF]">Preenchimento rápido:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSetting('defaultNewPaneUrl', 'https://play.roclassicidle.com.br/?app=ONLINE')
                    }
                    className="px-2 py-0.5 bg-[#090A0C] hover:bg-[#232832] text-[#10B981] border border-[#232832] text-[10px] font-mono rounded-[2px] cursor-pointer"
                  >
                    RO Classic Idle
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSetting('defaultNewPaneUrl', 'about:blank')}
                    className="px-2 py-0.5 bg-[#090A0C] hover:bg-[#232832] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#232832] text-[10px] font-mono rounded-[2px] cursor-pointer"
                  >
                    Página em Branco
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#090A0C] border border-[#232832] rounded-[2px] space-y-1">
                <span className="text-[11px] font-bold text-[#F3F4F6]">
                  Como funciona a adição de janelas?
                </span>
                <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                  O 4Nav inicia agora com <strong>1 janela principal</strong>. Para abrir uma segunda conta, clique no botão <span className="text-[#10B981] font-bold">+ Adicionar Janela</span> na barra superior. A grade se divide automaticamente em 2, 3, 4 ou mais telas de acordo com a sua necessidade de jogo!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-[48px] px-5 bg-[#090A0C] border-t border-[#232832] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onResetSettings}
            className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            <ArrowCounterClockwise size={13} />
            <span>Restaurar Padrões</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#090A0C] font-bold text-[11px] rounded-[2px] transition-colors cursor-pointer"
          >
            <Check size={14} weight="bold" />
            <span>Concluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

