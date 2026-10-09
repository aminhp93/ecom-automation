'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** Nút copy lệnh để dán vào Claude Code — web không tự gọi Claude. */
export function CopyCommand({ label, command, compact = false, className = '' }: { label: string; command: string; compact?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={command}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(command);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt('Copy lệnh này vào Claude:', command);
        }
      }}
      className={`inline-flex items-center rounded-md border border-zinc-200 bg-white font-medium text-zinc-700 hover:bg-zinc-50 ${compact ? 'gap-1 px-1.5 py-0.5 text-[11px] whitespace-nowrap' : 'gap-1.5 px-2.5 py-1.5 text-xs'} ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Đã copy' : label}
    </button>
  );
}
