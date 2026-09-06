'use client';

import React from 'react';
import {
  Sparkles,
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
    <aside className="w-72 bg-[#0c0d14] border-r border-[#1a1e2b] flex flex-col h-screen shrink-0 text-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1a1e2b] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-4 h-4 text-black font-bold" />
          </div>
          <div>
            <div className="font-bold text-slate-100 tracking-tight flex items-center gap-2">
              ECOM OS
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Dropship Workflow Engine</div>
          </div>
        </div>

        {/* Live Pulse */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-mono text-emerald-300">Live</span>
        </div>
      </div>

      {/* 12 Stages Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Ecom Pipeline (12 Stages)
        </div>

        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const isReady = stage.status === 'ready';

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131724]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-emerald-400'
                      : isReady
                      ? 'text-cyan-400'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate text-xs">{stage.name}</span>
              </div>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              )}
              {isReady && !isActive && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-500/30">
                  Ready
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* AI Router & Cost Status */}
      <div className="p-3 border-t border-[#1a1e2b] bg-[#090a0f] space-y-3">
        {/* Token & Cost Tracker */}
        <div className="p-2.5 rounded-lg bg-[#11131c] border border-[#1e2333]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" /> AI Spending Tracker
            </span>
            <span className="font-mono text-emerald-400 font-medium">
              ${stats?.totalCostUsd ? stats.totalCostUsd.toFixed(4) : '0.0000'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tokens Consumed:</span>
            <span className="font-mono text-slate-300">
              {stats?.totalTokens?.toLocaleString() || '560'}
            </span>
          </div>
        </div>

        {/* AI Model Router Status */}
        <div className="p-2.5 rounded-lg bg-[#11131c] border border-[#1e2333] space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Router Workers
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Gemini 3.6 Flash</span>
              <span className="text-[10px] text-emerald-400 font-mono">Free ($0.00)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Claude 3.5 Sonnet</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {providers?.claude?.available ? 'Ready' : 'Standby'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>OpenAI GPT-4o-mini</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {providers?.openai?.available ? 'Ready' : 'Standby'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
