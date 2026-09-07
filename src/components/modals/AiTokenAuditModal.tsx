'use client';

import React, { useState } from 'react';
import {
  X,
  Cpu,
  Coins,
  Zap,
  Clock,
  CheckCircle2,
  TrendingDown,
  Layers,
  Activity,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export interface WorkerStatItem {
  id: string;
  displayName: string;
  provider: string;
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  avgLatencyMs: number;
  role: string;
  tier: string;
  status: 'active' | 'ready' | 'standby';
}

export interface TaskStatItem {
  task: string;
  agent: string;
  calls: number;
  tokens: number;
  costUsd: number;
}

export interface AgentRunItem {
  id: string;
  workflow_run_id?: string;
  agent: string;
  provider: string;
  model: string;
  task: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
}

interface AiTokenAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    totalTokens: number;
    totalCostUsd: number;
    totalRuns?: number;
    workerStats?: WorkerStatItem[];
    taskStats?: TaskStatItem[];
    recentRuns?: AgentRunItem[];
  };
}

export const AiTokenAuditModal: React.FC<AiTokenAuditModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState<'workers' | 'tasks' | 'logs'>('workers');

  if (!isOpen) return null;

  const totalTokens = stats?.totalTokens || 0;
  const totalCost = stats?.totalCostUsd || 0;
  const workerList = stats?.workerStats || [];
  const taskList = stats?.taskStats || [];
  const recentRuns = stats?.recentRuns || [];

  const totalCalls = workerList.reduce((acc, w) => acc + w.calls, 0);

  // Group workers into consolidated view (e.g. merge gemini models or display distinct)
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-zinc-900 text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900">
                  AI Worker Token & Cost Audit
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  Live Telemetry
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Chi tiết mức độ tiêu thụ tokens, chi phí thực tế và độ trễ theo từng mô hình AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="p-5 border-b border-zinc-100 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 shadow-2xs font-mono">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>Tổng Tokens</span>
              <Zap className="w-3 h-3 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-zinc-900 mt-1">
              {totalTokens.toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Đã xử lý qua Router
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 shadow-2xs font-mono">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>Tổng Chi Phí</span>
              <Coins className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-lg font-bold text-emerald-700 mt-1">
              ${totalCost.toFixed(4)}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              Tiết kiệm tối đa qua Free Tier
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 shadow-2xs font-mono">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>Tổng Số Lần Gọi</span>
              <Activity className="w-3 h-3 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-zinc-900 mt-1">
              {totalCalls || recentRuns.length} calls
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              100% tỷ lệ thành công
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 shadow-2xs font-mono">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>Mô Hình Chủ Lực</span>
              <Cpu className="w-3 h-3 text-purple-500" />
            </div>
            <div className="text-sm font-bold text-zinc-900 mt-1 truncate">
              Gemini 3.6 Flash
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Free Developer Engine
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-white border-b border-zinc-200 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('workers')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'workers'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Chi Tiết Theo Worker ({workerList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'tasks'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Theo Giai Đoạn / Tác Vụ</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'logs'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Lịch Sử Gọi AI ({recentRuns.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-zinc-700">
          {/* TAB 1: WORKERS BREAKDOWN */}
          {activeTab === 'workers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-1">
                <span>Danh sách AI Workers được quản trị bởi AIRouter:</span>
                <span className="font-mono">Total: {totalTokens.toLocaleString()} tokens</span>
              </div>

              <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                {workerList.map((w, idx) => {
                  const sharePct = totalTokens > 0 ? ((w.totalTokens / totalTokens) * 100).toFixed(1) : '0';
                  return (
                    <div key={idx} className="p-3.5 hover:bg-zinc-50/70 transition space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 text-xs">{w.displayName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {w.provider.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">({w.model})</span>
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-bold text-zinc-900">
                            {w.totalTokens.toLocaleString()} tokens
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            ${w.costUsd.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-500">{w.role}</div>

                      {/* Progress Bar for Token Share */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>
                            Input: {w.inputTokens.toLocaleString()} | Output: {w.outputTokens.toLocaleString()} • {w.calls} calls
                          </span>
                          <span>{sharePct}% tổng lượng token</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              w.calls > 0 ? 'bg-black' : 'bg-zinc-300'
                            }`}
                            style={{ width: `${Math.max(Number(sharePct), w.calls > 0 ? 3 : 0)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-100">
                        <span>Biểu phí: {w.tier}</span>
                        <span>Độ trễ TB: {w.avgLatencyMs > 0 ? `${w.avgLatencyMs}ms` : 'Chưa kích hoạt'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TASKS BREAKDOWN */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="text-[11px] text-zinc-500 pb-1">
                Phân bổ token theo từng công đoạn trong Pipeline:
              </div>

              {taskList.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500">
                  Chưa có dữ liệu tác vụ chi tiết.
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs text-zinc-700">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500">
                      <tr>
                        <th className="py-2.5 px-3.5">Tác Vụ Pipeline</th>
                        <th className="py-2.5 px-3">Agent Phụ Trách</th>
                        <th className="py-2.5 px-3">Số Lần Gọi</th>
                        <th className="py-2.5 px-3">Tokens Tiêu Thụ</th>
                        <th className="py-2.5 px-3.5 text-right">Chi Phí</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono">
                      {taskList.map((t, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition">
                          <td className="py-3 px-3.5 font-sans font-medium text-zinc-900">
                            {t.task}
                          </td>
                          <td className="py-3 px-3 font-sans text-zinc-600">
                            {t.agent}
                          </td>
                          <td className="py-3 px-3 text-zinc-700">{t.calls}</td>
                          <td className="py-3 px-3 font-semibold text-zinc-900">
                            {t.tokens.toLocaleString()}
                          </td>
                          <td className="py-3 px-3.5 text-right font-semibold text-emerald-700">
                            ${t.costUsd.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVOCATION LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-1">
                <span>Nhật ký thời gian thực các lần AI Worker được kích hoạt:</span>
                <span className="font-mono">{recentRuns.length} runs</span>
              </div>

              {recentRuns.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500">
                  Chưa có lần chạy nào được ghi nhận.
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-700">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500">
                        <tr>
                          <th className="py-2 px-3">Thời Gian</th>
                          <th className="py-2 px-3">Agent / Tác Vụ</th>
                          <th className="py-2 px-3">Worker Model</th>
                          <th className="py-2 px-3">In / Out</th>
                          <th className="py-2 px-3">Total Tokens</th>
                          <th className="py-2 px-3">Chi Phí</th>
                          <th className="py-2 px-3 text-right">Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                        {recentRuns.map((r, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50 transition">
                            <td className="py-2.5 px-3 text-zinc-500 text-[10px]">
                              {new Date(r.created_at).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 font-sans font-medium text-zinc-900">
                              {r.agent || r.task}
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px]">
                                {r.model}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500">
                              {r.input_tokens} / {r.output_tokens}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-900">
                              {r.total_tokens.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-700">
                              ${r.cost_usd.toFixed(4)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-600">
                              {r.latency_ms ? `${(r.latency_ms / 1000).toFixed(1)}s` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-zinc-500 font-mono">
            Orchestrated by AIRouter (Google Gemini, Anthropic Claude, OpenAI)
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-zinc-900 text-white font-medium text-xs hover:bg-black transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
