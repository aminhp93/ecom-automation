'use client';

import React from 'react';
import { RefreshCw, Cpu } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="h-12 border-b border-zinc-200 bg-white px-5 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
          <span className="text-zinc-400">System:</span>
          <span className="text-zinc-900 font-medium">Orchestrator Ready</span>
        </div>

        <span className="text-zinc-300">/</span>

        <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
          <Cpu className="w-3 h-3 text-zinc-400" />
          <span>Default:</span>
          <span className="text-zinc-800">Gemini 3.6 Flash</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition text-xs flex items-center gap-1.5"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-zinc-900' : ''}`} />
          <span className="hidden sm:inline text-[11px]">Refresh</span>
        </button>

        <div className="h-3.5 w-px bg-zinc-200" />

        <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-zinc-700 text-[11px]">
          ⌘
        </div>
      </div>
    </header>
  );
};
