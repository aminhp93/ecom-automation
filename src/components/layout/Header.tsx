'use client';

import React from 'react';
import { RefreshCw, Cpu } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="h-12 border-b border-[#27272a] bg-[#09090b] px-5 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          <span className="text-zinc-500">System:</span>
          <span className="text-zinc-200 font-medium">Orchestrator Ready</span>
        </div>

        <span className="text-zinc-800">/</span>

        <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
          <Cpu className="w-3 h-3 text-zinc-400" />
          <span>Default:</span>
          <span className="text-zinc-300">Gemini 3.6 Flash</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition text-xs flex items-center gap-1.5"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-zinc-200' : ''}`} />
          <span className="hidden sm:inline text-[11px]">Refresh</span>
        </button>

        <div className="h-3.5 w-px bg-zinc-800" />

        <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-zinc-300 text-[11px]">
          ⌘
        </div>
      </div>
    </header>
  );
};
