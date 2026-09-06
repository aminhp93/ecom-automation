'use client';

import React from 'react';
import {
  Compass,
  CheckCircle2,
  Users,
  Truck,
  Tag,
  Store,
  Film,
  Megaphone,
  Rocket,
  LineChart,
  Sliders,
  TrendingUp,
  Cpu,
  Coins,
} from 'lucide-react';

interface SidebarProps {
  currentStage: string;
  onSelectStage: (stage: string) => void;
  stats?: {
    totalProducts: number;
    approvedProducts: number;
    totalTokens: number;
    totalCostUsd: number;
  };
  providers?: Record<string, { available: boolean; model: string; tier: string }>;
}

const STAGES = [
  { id: '01', name: '01 Product Discovery', icon: Compass, status: 'active' },
  { id: '02', name: '02 Product Validation', icon: CheckCircle2, status: 'ready' },
  { id: '03', name: '03 Competitor Research', icon: Users, status: 'planned' },
  { id: '04', name: '04 Supplier Validation', icon: Truck, status: 'planned' },
  { id: '05', name: '05 Offer Creation', icon: Tag, status: 'planned' },
  { id: '06', name: '06 Store / Product Page', icon: Store, status: 'planned' },
  { id: '07', name: '07 Creative Production', icon: Film, status: 'planned' },
  { id: '08', name: '08 Advertising Setup', icon: Megaphone, status: 'planned' },
  { id: '09', name: '09 Launch', icon: Rocket, status: 'planned' },
  { id: '10', name: '10 Performance Analysis', icon: LineChart, status: 'planned' },
  { id: '11', name: '11 Optimization', icon: Sliders, status: 'planned' },
  { id: '12', name: '12 Scaling / Kill', icon: TrendingUp, status: 'planned' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentStage,
  onSelectStage,
  stats,
  providers,
}) => {
  return (
    <aside className="w-64 bg-[#09090b] border-r border-[#27272a] flex flex-col h-screen shrink-0 text-sm select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold text-xs">
            E
          </div>
          <div>
            <div className="font-semibold text-zinc-100 tracking-tight flex items-center gap-1.5 text-xs">
              Ecom OS
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">Autonomous Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          <span className="text-[10px] font-mono text-zinc-400">Online</span>
        </div>
      </div>

      {/* 12 Stages Navigation */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
        <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Workflows
        </div>

        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const isReady = stage.status === 'ready';

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-colors ${
                isActive
                  ? 'bg-zinc-800/80 text-white font-medium border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-zinc-100' : 'text-zinc-500'
                  }`}
                />
                <span className="truncate text-xs">{stage.name}</span>
              </div>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>
              )}
              {isReady && !isActive && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                  Ready
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* AI Router & Cost Status */}
      <div className="p-3 border-t border-[#27272a] bg-[#0c0c0e] space-y-2.5">
        {/* Token & Cost Tracker */}
        <div className="p-2 rounded-md bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-zinc-400" /> AI Cost
            </span>
            <span className="font-mono text-zinc-200 font-medium">
              ${stats?.totalCostUsd ? stats.totalCostUsd.toFixed(4) : '0.0000'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>Tokens:</span>
            <span className="font-mono text-zinc-400">
              {stats?.totalTokens?.toLocaleString() || '560'}
            </span>
          </div>
        </div>

        {/* AI Model Workers Status */}
        <div className="p-2 rounded-md bg-zinc-900/80 border border-zinc-800 space-y-1 text-[11px]">
          <div className="text-[10px] font-semibold text-zinc-400 flex items-center justify-between pb-1 border-b border-zinc-800/80">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-zinc-400" /> AI Workers
            </span>
          </div>

          <div className="flex items-center justify-between text-zinc-300">
            <span>Gemini 3.6 Flash</span>
            <span className="text-[10px] text-zinc-400 font-mono">Free ($0.00)</span>
          </div>
          <div className="flex items-center justify-between text-zinc-500">
            <span>Claude 3.5 Sonnet</span>
            <span className="text-[10px] font-mono">
              {providers?.claude?.available ? 'Ready' : 'Standby'}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-500">
            <span>OpenAI GPT-4o-mini</span>
            <span className="text-[10px] font-mono">
              {providers?.openai?.available ? 'Ready' : 'Standby'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
