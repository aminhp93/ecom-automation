'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { WorkflowEvent } from '@/lib/db/store';

interface WorkflowTerminalProps {
  logs: WorkflowEvent[];
  isRunning: boolean;
  progress: number;
}

export const WorkflowTerminal: React.FC<WorkflowTerminalProps> = ({
  logs,
  isRunning,
  progress,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  if (logs.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="bg-[#0b0c13] border border-[#1e2333] rounded-xl overflow-hidden shadow-2xl shadow-black/50 mb-6">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-[#10121c] border-b border-[#1a1e2b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Workflow Engine Stream</span>
            {isRunning ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Executing AI Pipeline ({progress}%)
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                Idle / Finished
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Real-time Progress Bar */}
      {isRunning && (
        <div className="w-full bg-[#151928] h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Terminal Body */}
      {isExpanded && (
        <div className="p-4 font-mono text-xs max-h-64 overflow-y-auto space-y-2 bg-[#08090f]/90">
          {logs.map((log) => {
            let badgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            let icon = '•';

            if (log.type === 'search') {
              badgeClass = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
              icon = '🔎';
            } else if (log.type === 'found') {
              badgeClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
              icon = '✓';
            } else if (log.type === 'ai_analyze') {
              badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              icon = '🤖';
            } else if (log.type === 'score') {
              badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
              icon = '🏆';
            } else if (log.type === 'done') {
              badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
              icon = '🎉';
            } else if (log.type === 'error') {
              badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/50';
              icon = '⚠️';
            }

            return (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-slate-400 text-[11px] shrink-0 select-none">
                  [{log.timestamp}]
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}
                >
                  {icon} {log.type.toUpperCase()}
                </span>
                <span className="text-slate-200 break-words">{log.message}</span>
              </div>
            );
          })}

          {isRunning && (
            <div className="flex items-center gap-2 text-emerald-400 text-[11px] pt-1 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Worker đang phân tích và truyền dữ liệu theo luồng...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
