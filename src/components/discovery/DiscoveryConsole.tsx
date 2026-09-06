'use client';

import React, { useState } from 'react';
import { Search, Play, Loader2 } from 'lucide-react';

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
    <div className="bg-[#121215] border border-[#27272a] rounded-lg p-4 mb-5 space-y-4">
      {/* Top Banner: Workflow Trigger Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>01 Product Discovery</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Active
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Crawl dữ liệu, trích xuất góc USP, tính Landed Cost và chấm điểm 6 yếu tố Dropshipping.
            </p>
          </div>

          <button
            onClick={() => handleRun()}
            disabled={isRunning || !niche.trim()}
            className={`px-3.5 py-2 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition-colors shrink-0 ${
              isRunning
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed'
                : 'bg-white text-black hover:bg-zinc-200 active:bg-zinc-300'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-black" />
                <span>Run Discovery</span>
              </>
            )}
          </button>
        </div>

        {/* Niche Input & Source Selectors */}
        <form onSubmit={handleRun} className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Nhập Niche hoặc từ khóa (ví dụ: baby teething, pet care...)"
              className="w-full pl-8 pr-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-md text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          {/* Sources checkboxes */}
          <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-md border border-[#27272a]">
            <span className="text-[11px] text-zinc-500 px-1.5 font-medium">Nguồn:</span>
            {PLATFORMS.map((platform) => {
              const checked = selectedSources.includes(platform.id);
              return (
                <button
                  type="button"
                  key={platform.id}
                  onClick={() => toggleSource(platform.id)}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    checked
                      ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
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
          <span className="text-[11px] text-zinc-500">Niche mẫu:</span>
          {PRESET_NICHES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setNiche(preset)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                niche === preset
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-600'
                  : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Filter / Search within results bar */}
      <div className="pt-3 border-t border-[#27272a] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleFilterUpdate(e.target.value, statusFilter, minScore);
          }}
          placeholder="Tìm kiếm trong kết quả..."
          className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded-md text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-full max-w-xs"
        />

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              handleFilterUpdate(searchQuery, e.target.value, minScore);
            }}
            className="bg-[#18181b] border border-[#27272a] text-zinc-300 text-xs px-2.5 py-1 rounded-md focus:outline-none"
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
                ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                : 'bg-[#18181b] text-zinc-500 border-[#27272a] hover:text-zinc-300'
            }`}
          >
            {minScore > 0 ? `Score ≥ ${minScore}` : 'Tất cả điểm'}
          </button>
        </div>
      </div>
    </div>
  );
};
