'use client';

import React, { useState } from 'react';
import { Search, Play, Loader2, Plus } from 'lucide-react';

interface DiscoveryConsoleProps {
  onRunWorkflow: (niche: string, sources: string[]) => void;
  isRunning: boolean;
  onFilterChange: (filters: { query: string; status: string; minScore: number }) => void;
  onOpenAddCustom?: () => void;
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
  onOpenAddCustom,
}) => {
  const [niche, setNiche] = useState('Baby Products');
  const [selectedSources, setSelectedSources] = useState<string[]>([
    'tiktok',
    'meta_ads',
    'amazon',
    'aliexpress',
  ]);

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
    <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-5 space-y-4 shadow-2xs">
      {/* Top Banner: Workflow Trigger Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <span>01 Product Discovery</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                Active
              </span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Crawl dữ liệu, trích xuất góc USP, tính Landed Cost và chấm điểm 6 yếu tố Dropshipping.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAddCustom && (
              <button
                type="button"
                onClick={onOpenAddCustom}
                className="px-3 py-2 rounded-md font-medium text-xs flex items-center gap-1.5 border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Sản Phẩm Của Tôi</span>
              </button>
            )}

            <button
              onClick={() => handleRun()}
              disabled={isRunning || !niche.trim()}
              className={`px-3.5 py-2 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition-colors shrink-0 shadow-2xs ${
                isRunning
                  ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-zinc-800 active:bg-zinc-900'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-white" />
                  <span>Run Discovery</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Niche Input & Source Selectors */}
        <form onSubmit={handleRun} className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Nhập Niche hoặc từ khóa (ví dụ: baby teething, pet care...)"
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
            />
          </div>

          {/* Sources checkboxes */}
          <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-md border border-zinc-200">
            <span className="text-[11px] text-zinc-400 px-1.5 font-medium">Nguồn:</span>
            {PLATFORMS.map((platform) => {
              const checked = selectedSources.includes(platform.id);
              return (
                <button
                  type="button"
                  key={platform.id}
                  onClick={() => toggleSource(platform.id)}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    checked
                      ? 'bg-white text-zinc-900 font-medium border border-zinc-200 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {platform.label}
                </button>
              );
            })}
          </div>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 mt-2.5 text-xs text-zinc-500">
          <span className="text-[11px] text-zinc-400">Niche mẫu:</span>
          {PRESET_NICHES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setNiche(preset)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                niche === preset
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-300 font-medium'
                  : 'bg-transparent text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Filter / Search within results bar */}
      <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleFilterUpdate(e.target.value, statusFilter, minScore);
          }}
          placeholder="Tìm kiếm trong kết quả..."
          className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white w-full max-w-xs"
        />

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              handleFilterUpdate(searchQuery, e.target.value, minScore);
            }}
            className="bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs px-2.5 py-1 rounded-md focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="discovered">Chờ duyệt</option>
            <option value="approved_for_validation">Đã duyệt (Stg 02)</option>
          </select>

          <button
            onClick={() => {
              const next = minScore === 0 ? 80 : minScore === 80 ? 85 : 0;
              setMinScore(next);
              handleFilterUpdate(searchQuery, statusFilter, next);
            }}
            className={`px-2.5 py-1 rounded-md border text-[11px] font-mono transition-colors ${
              minScore > 0
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300 font-medium'
                : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-800'
            }`}
          >
            {minScore > 0 ? `Score ≥ ${minScore}` : 'Tất cả điểm'}
          </button>
        </div>
      </div>
    </div>
  );
};
