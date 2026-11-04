import React, { useState } from 'react';
import {
  DownloadSimple,
  FolderOpen,
  FileText,
  X,
  Trash,
  CheckCircle,
  ShieldWarning,
} from '@phosphor-icons/react';
import type { DownloadItem } from '../types/browser.types';

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadItem[];
  onClearDownloads: () => void;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({
  isOpen,
  onClose,
  downloads,
  onClearDownloads,
}) => {
  const [filter, setFilter] = useState<'all' | 'progressing' | 'completed'>('all');

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (!bytesPerSec || bytesPerSec === 0) return '';
    return formatBytes(bytesPerSec) + '/s';
  };

  const handleOpenFile = async (filePath?: string) => {
    if (!filePath || !window.electronAPI?.openDownloadedFile) return;
    const res = await window.electronAPI.openDownloadedFile(filePath);
    if (!res.ok && res.error) {
      alert(`Não foi possível abrir o arquivo: ${res.error}`);
    }
  };

  const handleShowInFolder = async (filePath?: string) => {
    if (!filePath || !window.electronAPI?.showDownloadedFileInFolder) return;
    await window.electronAPI.showDownloadedFileInFolder(filePath);
  };

  const handleCancel = async (id: string) => {
    if (window.electronAPI?.cancelDownload) {
      await window.electronAPI.cancelDownload(id);
    }
  };

  const filteredDownloads = downloads.filter((item) => {
    if (filter === 'progressing') return item.state === 'progressing';
    if (filter === 'completed') return item.state === 'completed';
    return true;
  });

  const activeCount = downloads.filter((d) => d.state === 'progressing').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-[#0F1218] border border-[#232832] rounded-[4px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141822] border-b border-[#232832]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#3B82F6]/15 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6]">
              <DownloadSimple size={18} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#F3F4F6] tracking-wide">
                  Gerenciador de Downloads
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                  Ctrl+J
                </span>
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-[2px] font-mono text-[9px] font-bold bg-[#10B981] text-black animate-pulse">
                    {activeCount} ativo{activeCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                Progresso em tempo real e proteção de integridade contra executáveis maliciosos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {downloads.length > 0 && (
              <button
                type="button"
                onClick={onClearDownloads}
                className="px-2.5 py-1 text-[11px] font-medium text-[#9CA3AF] hover:text-[#EF4444] bg-[#161B24] hover:bg-[#202736] border border-[#232832] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash size={12} />
                <span>Limpar Lista</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[3px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] transition-colors cursor-pointer"
            >
              <X size={15} weight="bold" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 bg-[#0B0E14] border-b border-[#1E2534] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-[3px] text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#141822]'
            }`}
          >
            Todos ({downloads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('progressing')}
            className={`px-3 py-1 rounded-[3px] text-xs font-medium transition-colors cursor-pointer ${
              filter === 'progressing'
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#141822]'
            }`}
          >
            Em Andamento ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-[3px] text-xs font-medium transition-colors cursor-pointer ${
              filter === 'completed'
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#141822]'
            }`}
          >
            Concluídos ({downloads.filter((d) => d.state === 'completed').length})
          </button>
        </div>

        {/* Downloads List */}
        <div className="p-4 flex-1 overflow-y-auto">
          {filteredDownloads.length === 0 ? (
            <div className="py-16 text-center text-[#6B7280]">
              <DownloadSimple size={36} className="mx-auto mb-2 opacity-40 text-[#3B82F6]" />
              <p className="text-xs">
                {filter === 'progressing'
                  ? 'Nenhum download em andamento no momento.'
                  : filter === 'completed'
                  ? 'Nenhum download concluído.'
                  : 'Nenhum download realizado nesta sessão.'}
              </p>
              <p className="text-[11px] mt-1 text-[#4B5563]">
                Arquivos baixados nos quadrantes aparecerão aqui com velocidade e progresso ao vivo.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredDownloads.map((item) => {
                const isProgressing = item.state === 'progressing';
                const isCompleted = item.state === 'completed';
                const isBlocked = item.state === 'blocked';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-[4px] border transition-colors flex flex-col gap-2 ${
                      isBlocked
                        ? 'bg-[#221013] border-[#5E1A22]'
                        : isProgressing
                        ? 'bg-[#111624] border-[#2563EB]/40 shadow-xs'
                        : 'bg-[#11151F] border-[#1E2534] hover:border-[#2C364A]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-[3px] flex items-center justify-center shrink-0 mt-0.5 ${
                            isBlocked
                              ? 'bg-[#EF4444]/20 text-[#EF4444]'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isProgressing
                              ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                              : 'bg-[#232832] text-[#9CA3AF]'
                          }`}
                        >
                          {isBlocked ? (
                            <ShieldWarning size={16} weight="bold" />
                          ) : isCompleted ? (
                            <CheckCircle size={16} weight="bold" />
                          ) : isProgressing ? (
                            <DownloadSimple size={16} weight="bold" className="animate-bounce" />
                          ) : (
                            <FileText size={16} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-[#F3F4F6] truncate" title={item.filename}>
                              {item.filename}
                            </span>
                            {item.ext && (
                              <span className="px-1 py-0.2 rounded-[2px] font-mono text-[9px] bg-[#1E2534] text-[#9CA3AF] uppercase">
                                {item.ext.replace('.', '')}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] font-mono text-[#6B7280] truncate mt-0.5">
                            {item.url}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isBlocked ? (
                          <span className="px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                            BLOQUEADO
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            CONCLUÍDO
                          </span>
                        ) : isProgressing ? (
                          <span className="px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/40">
                            {item.percent}%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[2px] font-mono text-[10px] bg-[#232832] text-[#9CA3AF]">
                            CANCELADO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar (if in progress) */}
                    {isProgressing && (
                      <div className="w-full bg-[#181E2E] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#3B82F6] h-full transition-all duration-200"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    )}

                    {/* Details row: Bytes, Speed & Action Buttons */}
                    <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pt-1 border-t border-[#1C2230]">
                      <div className="flex items-center gap-2">
                        {isBlocked ? (
                          <span className="text-[#EF4444] text-[10px]">
                            {item.errorMessage || 'Executável de risco bloqueado por segurança'}
                          </span>
                        ) : (
                          <>
                            <span className="font-mono text-[10px]">
                              {formatBytes(item.receivedBytes)}
                              {item.totalBytes > 0 ? ` / ${formatBytes(item.totalBytes)}` : ''}
                            </span>
                            {isProgressing && item.speed > 0 && (
                              <span className="text-[10px] text-emerald-400 font-mono">
                                • {formatSpeed(item.speed)}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {isProgressing && (
                          <button
                            type="button"
                            onClick={() => handleCancel(item.id)}
                            className="px-2 py-0.5 text-[10px] text-[#EF4444] hover:bg-[#EF4444]/15 rounded-[2px] cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}

                        {isCompleted && item.savePath && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenFile(item.savePath)}
                              className="px-2 py-0.5 text-[10px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[2px] cursor-pointer flex items-center gap-1"
                            >
                              <span>Abrir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShowInFolder(item.savePath)}
                              title="Mostrar na pasta do Windows"
                              className="px-2 py-0.5 text-[10px] text-[#9CA3AF] hover:text-[#F3F4F6] bg-[#161B24] hover:bg-[#202736] rounded-[2px] cursor-pointer flex items-center gap-1"
                            >
                              <FolderOpen size={11} />
                              <span>Pasta</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0A0D13] border-t border-[#1E2534] flex items-center justify-between text-[11px] text-[#6B7280]">
          <span>Total: {downloads.length} download(s)</span>
          <span className="font-mono text-[10px]">Atalho rápido: Ctrl+J</span>
        </div>
      </div>
    </div>
  );
};
