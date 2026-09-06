'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Filter, Loader2, Play } from 'lucide-react';

interface DiscoveryConsoleProps {
  onRunWorkflow: (niche: string, sources: string[]) => void;
  isRunning: boolean;
  onFilterChange: (filters: { query: string; status: string; minScore: number }) => void;
}

const PRESET_NICHES = [
  'Baby Products',
  'Pet Care',
  'Car Accessories',
  'Smart Home',
  'Kitchen Gadgets',
];

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'meta_ads', label: 'Meta Ads' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'aliexpress', label: 'AliExpress' },
];

export const DiscoveryConsole: React.FC<DiscoveryConsoleProps> = ({
  onRunWorkflow,
  isRunning,
  onFilterChange,
}) => {
  const [niche, setNiche] = useState('Baby Products');
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'tiktok',
    'meta_ads',
    'amazon',
    'aliexpress',
  ]);

  // Client search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minScore, setMinScore] = useState(0);

  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      if (selectedSources.length > 1) {
        setSelectedSources(selectedSources.filter((s) => s !== sourceId));
      }
    } else {
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const handleRun = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRunning || !niche.trim()) return;
    onRunWorkflow(niche.trim(), selectedSources);
  };

  const handleFilterUpdate = (newQuery = searchQuery, newStatus = statusFilter, newMin = minScore) => {
    onFilterChange({
      query: newQuery,
      status: newStatus,
      minScore: newMin,
    });
  };

  return (
    <div className="bg-[#0e1017] border border-[#1c202e] rounded-xl p-5 mb-6 shadow-xl space-y-4">
      {/* Top Banner: Workflow Trigger Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Stage 01 — Product Discovery & Research</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Crawl tự động các kênh mạng xã hội, phân tích USP, tính toán Unit Economics và tính điểm tiềm năng Dropship 6 yếu tố.
            </p>
          </div>

          <button
            onClick={() => handleRun()}
            disabled={isRunning || !niche.trim()}
            className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all shadow-lg ${
              isRunning
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:brightness-110 active:scale-95 shadow-emerald-500/20'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Engine Đang Chạy...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Run Product Discovery</span>
              </>
            )}
          </button>
        </div>

        {/* Niche Input & Source Selectors */}
        <form onSubmit={handleRun} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Nhập Niche hoặc từ khóa sản phẩm (ví dụ: baby teething, pet grooming...)"
              className="w-full pl-9 pr-3 py-2 bg-[#141724] border border-[#23283d] rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Sources checkboxes */}
          <div className="flex items-center gap-1.5 bg-[#141724] p-1 rounded-lg border border-[#23283d]">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Nguồn:</span>
            {PLATFORMS.map((platform) => {
              const checked = selectedSources.includes(platform.id);
              return (
                <button
                  type="button"
                  key={platform.id}
                  onClick={() => toggleSource(platform.id)}
                  className={`text-[11px] px-2.5 py-1 rounded transition-all ${
                    checked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {platform.label}
                </button>
              );
            })}
          </div>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-400">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Gợi ý niche hot:
          </span>
          {PRESET_NICHES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setNiche(preset);
              }}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                niche === preset
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-[#141724] text-slate-400 border-[#23283d] hover:text-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Filter / Search within results bar */}
      <div className="pt-3 border-t border-[#1c202e] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterUpdate(e.target.value, statusFilter, minScore);
            }}
            placeholder="Lọc nhanh kết quả theo tên hoặc USP..."
            className="px-2.5 py-1 bg-[#141724] border border-[#23283d] rounded-md text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full max-w-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              handleFilterUpdate(searchQuery, e.target.value, minScore);
            }}
            className="bg-[#141724] border border-[#23283d] text-slate-300 text-xs px-2.5 py-1 rounded-md focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="discovered">Chờ duyệt (Discovered)</option>
            <option value="approved_for_validation">Đã duyệt (Approved for Stage 02)</option>
          </select>

          {/* Min score filter */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Điểm tối thiểu:</span>
            <button
              onClick={() => {
                const next = minScore === 0 ? 80 : minScore === 80 ? 85 : 0;
                setMinScore(next);
                handleFilterUpdate(searchQuery, statusFilter, next);
              }}
              className={`px-2 py-0.5 rounded border text-[11px] font-mono transition ${
                minScore > 0
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-[#141724] text-slate-400 border-[#23283d]'
              }`}
            >
              {minScore > 0 ? `≥ ${minScore}đ (Hot)` : 'Tất cả'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
