'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mb-5 shadow-sm text-white">
      {/* Terminal Title Bar */}
      <div className="px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Workflow Console</span>
          {isRunning ? (
            <span className="text-[10px] text-zinc-300 bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 rounded font-mono">
              Running ({progress}%)
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 font-mono">Completed</span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="w-full bg-zinc-900 h-1">
          <div
            className="h-full bg-white transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Terminal Output */}
      {isExpanded && (
        <div className="p-3.5 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 bg-zinc-950">
          {logs.map((log) => {
            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed text-zinc-300">
                <span className="text-zinc-600 text-[11px] shrink-0 select-none">
                  {log.timestamp}
                </span>
                <span className="text-zinc-400 text-[10px] uppercase tracking-wide shrink-0 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                  {log.type}
                </span>
                <span className="break-words text-zinc-300">{log.message}</span>
              </div>
            );
          })}

          {isRunning && (
            <div className="flex items-center gap-2 text-zinc-400 text-[11px] pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
              <span>AI Worker is processing...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
