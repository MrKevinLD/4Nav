import React, { useState } from 'react';
import {
  MagnifyingGlass,
  ShieldCheck,
  ArrowUpRight,
  Compass,
  UserSwitch,
} from '@phosphor-icons/react';
import { QUICK_BOOKMARKS } from '../utils/url.utils';

interface SpeedDialProps {
  quadrantNumber: number;
  positionLabel: string;
  tabSessionNumber: number;
  sessionId: string;
  containerColor: string;
  isolateSubPane: boolean;
  onNavigate: (url: string, enableProxy?: boolean) => void;
  onToggleSubPaneIsolation: () => void;
}

export const SpeedDial: React.FC<SpeedDialProps> = ({
  quadrantNumber,
  positionLabel,
  tabSessionNumber,
  sessionId,
  containerColor,
  isolateSubPane,
  onNavigate,
  onToggleSubPaneIsolation,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onNavigate(searchInput.trim());
  };

  return (
    <div className="w-full h-full bg-[#090A0C] text-[#F3F4F6] overflow-y-auto p-4 flex flex-col justify-between select-none">
      {/* Top Header: Quadrant Identity + Isolated Session Status */}
      <div className="flex items-center justify-between gap-2 border-b border-[#232832] pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-[2px]"
            style={{
              backgroundColor: `${containerColor}1F`,
              color: containerColor,
              border: `1px solid ${containerColor}4D`,
            }}
          >
            QUADRANTE {quadrantNumber} • {positionLabel.toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleSubPaneIsolation}
          className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded-[2px] border transition-colors cursor-pointer ${
            isolateSubPane
              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
              : 'bg-[#111317] text-[#9CA3AF] border-[#232832] hover:text-[#F3F4F6]'
          }`}
          title="Permite isolar este quadrante até mesmo dos outros 3 quadrantes da mesma aba"
        >
          <UserSwitch size={12} />
          <span>
            {isolateSubPane
              ? `Sub-Sessão Exclusiva Q${quadrantNumber}`
              : `Sessão da Aba #${tabSessionNumber}`}
          </span>
        </button>
      </div>

      {/* Center: Quick Address / Search + Bookmarks */}
      <div className="my-auto py-4 max-w-[520px] w-full mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#3B82F6]">
            <ShieldCheck size={14} weight="fill" />
            <span>
              CONTAINER ISOLADO #{tabSessionNumber} ({sessionId.slice(0, 14)})
            </span>
          </div>
          <h2 className="text-[16px] font-semibold tracking-tight text-[#F3F4F6]">
            Navegação Autônoma — Quadrante {quadrantNumber}
          </h2>
          <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
            Cada aba funciona como um navegador próprio. Contas logadas na{' '}
            <strong className="text-[#F3F4F6]">Aba #{tabSessionNumber}</strong> (ex.: Facebook,
            Google) possuem cookies isolados e não se misturam com as outras abas.
          </p>
        </div>

        {/* Search / URL Bar */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-center gap-2 px-3 h-[38px] bg-[#111317] border border-[#232832] focus-within:border-[#3B82F6] rounded-[2px] transition-colors">
            <MagnifyingGlass size={15} className="text-[#9CA3AF] shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Digite uma URL (ex: facebook.com) ou pesquise..."
              aria-label={`Pesquisar ou digitar URL no quadrante ${quadrantNumber}`}
              className="w-full bg-transparent text-[12px] font-mono text-[#F3F4F6] placeholder-[#6B7280] outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-[11px] rounded-[2px] transition-colors shrink-0 cursor-pointer"
            >
              Abrir
            </button>
          </div>
        </form>

        {/* Quick Bookmarks Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {QUICK_BOOKMARKS.map((item) => (
            <button
              key={item.url}
              type="button"
              onClick={() => onNavigate(item.url, item.needsProxyInWeb)}
              className="group p-2 bg-[#111317] hover:bg-[#181B21] border border-[#232832] hover:border-[#3B82F6]/50 rounded-[2px] text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.badgeColor }}
                />
                <ArrowUpRight
                  size={12}
                  className="text-[#6B7280] group-hover:text-[#3B82F6] transition-colors"
                />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#F3F4F6] truncate">
                  {item.title}
                </div>
                <div className="text-[9px] font-mono text-[#6B7280] truncate">
                  {item.category}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280] border-t border-[#232832] pt-2">
        <span className="flex items-center gap-1">
          <Compass size={12} className="text-[#EAB308]" />
          Grade 2x2 Independente
        </span>
        <span>Duplo-clique nas divisórias para centralizar 50×50</span>
      </div>
    </div>
  );
};

