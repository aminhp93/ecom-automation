'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Users,
  Truck,
  Tag,
  Film,
  Megaphone,
  Rocket,
  LineChart,
  Sliders,
  TrendingUp,
  Cpu,
  Coins,
  Lock,
  Check,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Product } from '@/lib/db/store';

interface SidebarProps {
  currentStage: string;
  onSelectStage: (stage: string) => void;
  activeProduct?: Product | null;
  stats?: any;
  providers?: Record<string, { available: boolean; model: string; tier: string }>;
  onOpenTokenAudit?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// 6 Core Active Execution Stages (V1 Complete Pipeline)
const CORE_STAGES = [
  { id: '01', name: '01 Market Research', shortName: 'Research', icon: Compass },
  { id: '02', name: '02 Product Validation', shortName: 'Validation', icon: CheckCircle2 },
  { id: '03', name: '03 Competitor Research', shortName: 'Competitors', icon: Users },
  { id: '04', name: '04 Supplier & Economics', shortName: 'Economics', icon: Truck },
  { id: '05', name: '05 Offer Creation', shortName: 'Offer', icon: Tag },
  { id: '06', name: '06 Creative Studio', shortName: 'Creative', icon: Film },
];

// Roadmap V2 Stages (Expansion modules)
const ROADMAP_STAGES = [
  { id: '07', name: '07 Advertising Setup', icon: Megaphone },
  { id: '08', name: '08 Shopify Live Sync', icon: Store },
  { id: '09', name: '09 Campaign Launch', icon: Rocket },
  { id: '10', name: '10 Performance Analysis', icon: LineChart },
  { id: '11', name: '11 AI Optimization', icon: Sliders },
  { id: '12', name: '12 Scaling / Kill Guard', icon: TrendingUp },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentStage,
  onSelectStage,
  activeProduct,
  stats,
  providers,
  onOpenTokenAudit,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ecom_sidebar_collapsed');
      if (saved !== null) {
        setInternalCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const collapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('ecom_sidebar_collapsed', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const getStageStatus = (stageId: string) => {
    if (stageId === '06') return 'ready';
    if (!activeProduct) {
      if (stageId === '01') return 'ready';
      return 'locked';
    }
    const statusMap = activeProduct.stage_status;
    if (statusMap && (statusMap as any)[stageId]) {
      return (statusMap as any)[stageId];
    }
    // Fallback based on stage completed data
    if (stageId === '01') return 'completed';
    if (stageId === '02') return activeProduct.validation ? 'completed' : 'ready';
    if (stageId === '03') return activeProduct.competitor_analysis ? 'completed' : activeProduct.validation ? 'ready' : 'locked';
    if (stageId === '04') return activeProduct.supplier_economics ? 'completed' : activeProduct.competitor_analysis ? 'ready' : 'locked';
    if (stageId === '05') return activeProduct.offer_package ? 'completed' : activeProduct.supplier_economics ? 'ready' : 'locked';
    return 'locked';
  };

  return (
    <aside
      className={`bg-white border-r border-zinc-200 flex flex-col h-screen shrink-0 text-sm select-none transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`border-b border-zinc-200 flex items-center transition-all duration-300 ${
        collapsed ? 'flex-col p-2.5 gap-2 justify-center' : 'p-3.5 justify-between'
      }`}>
        {/* Logo + phiên bản: bấm để về trang chủ `/` */}
        <Link href="/" className="flex items-center gap-2.5" title="Về trang chủ" aria-label="Về trang chủ">
          <div className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs">
            E
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              v1.0
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1">
          {/* Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition focus:outline-none"
            title={collapsed ? 'Mở rộng menu (Sidebar)' : 'Thu gọn menu (Sidebar)'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-zinc-600 hover:text-black" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-zinc-400 hover:text-zinc-700" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto space-y-3 ${collapsed ? 'p-1.5' : 'p-2.5'}`}>
        {/* Core V1 Pipeline Section */}
        <div>
          {!collapsed ? (
            <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pipeline V1 (Core)</span>
              {activeProduct && (
                <span className="text-[9px] font-mono text-zinc-500 font-normal truncate max-w-[100px]" title={activeProduct.name}>
                  {activeProduct.name.split(' ')[0]}
                </span>
              )}
            </div>
          ) : (
            <div className="text-center py-1 text-[9px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              V1
            </div>
          )}

          <div className="space-y-1 mt-1">
            {CORE_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isActive = currentStage === stage.id;
              const status = getStageStatus(stage.id);

              return (
                <button
                  key={stage.id}
                  onClick={() => onSelectStage(stage.id)}
                  title={`${stage.name} • ${status === 'completed' ? 'Đã hoàn tất' : status === 'ready' ? 'Sẵn sàng' : 'Chưa mở khóa'}`}
                  className={`relative w-full rounded-md transition-all flex items-center ${
                    collapsed
                      ? 'justify-center p-2.5'
                      : 'justify-between px-2.5 py-2 text-left'
                  } ${
                    isActive
                      ? 'bg-zinc-900 text-white font-medium shadow-2xs'
                      : status === 'locked'
                      ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50 opacity-70'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <div className={`flex items-center truncate ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : status === 'completed'
                          ? 'text-emerald-600'
                          : status === 'locked'
                          ? 'text-zinc-300'
                          : 'text-zinc-500'
                      }`}
                    />
                    {!collapsed && <span className="truncate text-xs">{stage.name}</span>}
                  </div>

                  {!collapsed ? (
                    <div className="flex items-center gap-1">
                      {status === 'completed' && !isActive && (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      )}
                      {status === 'locked' && !isActive && (
                        <Lock className="w-2.5 h-2.5 text-zinc-300 shrink-0" />
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      )}
                    </div>
                  ) : (
                    <>
                      {status === 'completed' && !isActive && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      {status === 'locked' && !isActive && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-300" />
                      )}
                      {isActive && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roadmap V2 Section */}
        <div className={`pt-2 border-t border-zinc-100 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed ? (
            <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Roadmap V2</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
                Planned
              </span>
            </div>
          ) : (
            <div className="text-center py-1 text-[9px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              V2
            </div>
          )}

          <div className="space-y-1 mt-1">
            {ROADMAP_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isActive = currentStage === stage.id;

              return (
                <button
                  key={stage.id}
                  onClick={() => onSelectStage(stage.id)}
                  title={`${stage.name} • Thuộc Roadmap V2`}
                  className={`relative w-full rounded-md transition-colors flex items-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50 ${
                    collapsed
                      ? 'justify-center p-2.5'
                      : 'justify-between px-2.5 py-1.5 text-left'
                  } ${isActive ? 'bg-zinc-100 text-zinc-800 font-medium' : ''}`}
                >
                  <div className={`flex items-center truncate ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                    <Icon className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    {!collapsed && <span className="truncate text-[11px]">{stage.name}</span>}
                  </div>
                  {!collapsed ? (
                    <Lock className="w-2.5 h-2.5 text-zinc-300 shrink-0" />
                  ) : (
                    <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-zinc-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Router & Cost Status */}
      <div className={`border-t border-zinc-200 bg-zinc-50/50 transition-all ${collapsed ? 'p-2 space-y-2' : 'p-3 space-y-2.5'}`}>
        {!collapsed ? (
          <>
            {/* Token & Cost Tracker */}
            <div
              onClick={onOpenTokenAudit}
              className="p-2 rounded-md bg-white border border-zinc-200 shadow-2xs hover:border-zinc-300 hover:shadow-xs cursor-pointer transition group"
              title="Bấm để xem phân tích chi tiết tiêu hao Token & Chi phí"
            >
              <div className="flex items-center justify-between text-[11px] text-zinc-600 mb-1">
                <span className="flex items-center gap-1.5 font-medium group-hover:text-black transition">
                  <Coins className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-600 transition" /> AI Cost
                </span>
                <span className="font-mono text-zinc-900 font-semibold">
                  ${stats?.totalCostUsd ? stats.totalCostUsd.toFixed(4) : '0.0000'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>Tokens:</span>
                <span className="text-zinc-800 font-semibold">
                  {stats?.totalTokens?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            {/* AI Model Workers Status with Token Breakdown */}
            <div className="p-2 rounded-md bg-white border border-zinc-200 shadow-2xs space-y-1.5 text-[11px]">
              <div className="text-[10px] font-semibold text-zinc-500 flex items-center justify-between pb-1 border-b border-zinc-100">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-zinc-500" /> AI Workers
                </span>
                <button
                  onClick={onOpenTokenAudit}
                  className="text-[9px] font-mono text-zinc-500 hover:text-black flex items-center gap-0.5 underline transition"
                >
                  Audit 📊
                </button>
              </div>

              {/* Gemini Worker */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-700 font-medium">Gemini 2.5 Flash</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                  Free Tier
                </span>
              </div>

              {/* Claude Worker */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-700 font-medium">Claude Sonnet 4.5</span>
                <span className="font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                  Active
                </span>
              </div>

              {/* OpenAI Worker */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-700 font-medium">GPT-4o-mini</span>
                <span className="font-mono text-zinc-600 bg-zinc-100 px-1 py-0.2 rounded border border-zinc-200">
                  Ready
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            {/* Collapsed Compact Buttons */}
            <button
              type="button"
              onClick={onOpenTokenAudit}
              title={`AI Cost: $${stats?.totalCostUsd ? stats.totalCostUsd.toFixed(4) : '0.0000'} • ${stats?.totalTokens?.toLocaleString() || '0'} tokens (Bấm để xem Audit)`}
              className="w-10 h-10 rounded-md bg-white border border-zinc-200 hover:border-zinc-300 flex items-center justify-center text-zinc-600 hover:text-black shadow-2xs transition"
            >
              <Coins className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={onOpenTokenAudit}
              title="AI Workers Audit (Gemini, Claude, GPT)"
              className="w-10 h-10 rounded-md bg-white border border-zinc-200 hover:border-zinc-300 flex items-center justify-center text-zinc-600 hover:text-black shadow-2xs transition"
            >
              <Cpu className="w-4 h-4 text-zinc-600" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

