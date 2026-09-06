'use client';

import React from 'react';
import { RefreshCw, Zap, Cpu, Bell } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="h-14 border-b border-[#1a1e2b] bg-[#0c0d14]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-400">Environment:</span>
          <span className="text-emerald-400 font-semibold">Autonomous Orchestrator</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Worker:</span>
          <span className="text-slate-200 font-mono">Gemini Flash (Developer Free Quota)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs flex items-center gap-1.5"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline text-[11px]">Làm mới</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-black text-xs">
            OS
          </div>
        </div>
      </div>
    </header>
  );
};
