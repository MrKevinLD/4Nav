import React, { useState, useEffect } from 'react';
import {
  ClockCounterClockwise,
  MagnifyingGlass,
  Trash,
  X,
  Copy,
  Check,
  Globe,
  ArrowSquareOut,
  CalendarBlank,
} from '@phosphor-icons/react';
import {
  HistoryItem,
  loadHistory,
  deleteHistoryEntry,
  clearAllHistory,
} from '../utils/history.utils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToUrl: (url: string, targetQuadrant?: number) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onNavigateToUrl,
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHistoryItems(loadHistory());
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteItem = (id: string) => {
    const updated = deleteHistoryEntry(id);
    setHistoryItems(updated);
  };

  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de navegação?')) {
      clearAllHistory();
      setHistoryItems([]);
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const filteredItems = historyItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      item.host.toLowerCase().includes(q)
    );
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Group items by date string
  const groupedItems: { date: string; items: HistoryItem[] }[] = [];
  filteredItems.forEach((item) => {
    const dateStr = formatDate(item.timestamp);
    let group = groupedItems.find((g) => g.date === dateStr);
    if (!group) {
      group = { date: dateStr, items: [] };
      groupedItems.push(group);
    }
    group.items.push(item);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-[#0F1218] border border-[#232832] rounded-[4px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141822] border-b border-[#232832]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[#EAB308]/15 border border-[#EAB308]/40 flex items-center justify-center text-[#EAB308]">
              <ClockCounterClockwise size={18} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#F3F4F6] tracking-wide">
                  Histórico de Navegação
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30">
                  Ctrl+H
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                Páginas visitadas em todos os 4 quadrantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 text-[11px] font-medium text-[#EF4444] bg-[#2A1518] hover:bg-[#3D1A1F] border border-[#521C24] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash size={12} />
                <span>Limpar Tudo</span>
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

        {/* Search Bar */}
        <div className="p-3 bg-[#0B0E14] border-b border-[#1E2534]">
          <div className="relative">
            <MagnifyingGlass
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar histórico por título, site ou link..."
              className="w-full h-8 pl-9 pr-3 bg-[#11151F] border border-[#232832] rounded-[3px] text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
            />
          </div>
        </div>

        {/* History List */}
        <div className="p-4 flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-[#6B7280]">
              <ClockCounterClockwise size={36} className="mx-auto mb-2 opacity-40 text-[#EAB308]" />
              <p className="text-xs">
                {searchQuery
                  ? 'Nenhum resultado encontrado para a sua busca.'
                  : 'Nenhum histórico registrado ainda.'}
              </p>
              <p className="text-[11px] mt-1 text-[#4B5563]">
                As páginas que você navegar nas telas aparecerão automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedItems.map((group) => (
                <div key={group.date} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] px-1 py-0.5 border-b border-[#1C2230]">
                    <CalendarBlank size={12} className="text-[#EAB308]" />
                    <span>{group.date}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between gap-3 p-2 bg-[#121622] hover:bg-[#181E2E] border border-[#1E2534] hover:border-[#2F3B52] rounded-[3px] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-[#6B7280] shrink-0">
                            {formatTime(item.timestamp)}
                          </span>

                          <Globe size={13} className="text-[#3B82F6] shrink-0" />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => {
                                  onNavigateToUrl(item.url, item.quadrantNumber);
                                  onClose();
                                }}
                                className="font-medium text-xs text-[#F3F4F6] hover:text-[#3B82F6] cursor-pointer truncate"
                                title={item.title}
                              >
                                {item.title}
                              </span>
                              {item.quadrantNumber && (
                                <span className="px-1 py-0.2 rounded-[2px] font-mono text-[9px] bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 shrink-0">
                                  J{item.quadrantNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-[#6B7280] truncate">
                              {item.url}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Quick Open in specific Quadrants */}
                          <div className="hidden sm:flex items-center gap-0.5 bg-[#090C11] p-0.5 rounded-[2px] border border-[#1E2534]">
                            {[1, 2, 3, 4].map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => {
                                  onNavigateToUrl(item.url, slot);
                                  onClose();
                                }}
                                title={`Abrir no Quadrante J${slot}`}
                                className="px-1 py-0.2 text-[9px] font-mono text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] rounded-[2px] cursor-pointer"
                              >
                                J{slot}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onNavigateToUrl(item.url, item.quadrantNumber);
                              onClose();
                            }}
                            title="Abrir página"
                            className="px-2 py-1 text-[11px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[2px] flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Abrir</span>
                            <ArrowSquareOut size={11} />
                          </button>

                          <button
                            type="button"
                            onClick={() => copyUrl(item.url, item.id)}
                            title="Copiar Link"
                            className="w-6 h-6 flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#232832] cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            title="Excluir item do histórico"
                            className="w-6 h-6 flex items-center justify-center rounded-[2px] text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#232832] cursor-pointer"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0A0D13] border-t border-[#1E2534] flex items-center justify-between text-[11px] text-[#6B7280]">
          <span>Total de itens no histórico: {filteredItems.length}</span>
          <span className="font-mono text-[10px]">Atalho rápido: Ctrl+H</span>
        </div>
      </div>
    </div>
  );
};
