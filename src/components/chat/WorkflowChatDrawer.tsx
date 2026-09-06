'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const WorkflowChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_msg',
      sender: 'assistant',
      content:
        'Tôi là AI Analyst. Bạn có thể hỏi về các sản phẩm đã crawl, yêu cầu so sánh margin, phân tích góc quảng cáo, hoặc lọc theo tiêu chí.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const replyText = data.reply || 'Đã phân tích xong dữ liệu sản phẩm.';

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          content: 'Không thể kết nối đến AI Router. Hãy thử lại.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Minimal Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 px-3.5 py-2 rounded-full bg-black text-white font-medium text-xs flex items-center gap-1.5 shadow-lg hover:bg-zinc-800 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Analyst</span>
        </button>
      )}

      {/* Minimal Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-88 h-[460px] bg-white border border-zinc-200 rounded-xl flex flex-col shadow-2xl overflow-hidden text-xs">
          {/* Header */}
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-zinc-600" />
              <span className="font-semibold text-zinc-900">AI Analyst</span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {messages.map((m) => {
              const isBot = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                      isBot
                        ? 'bg-zinc-100 border border-zinc-200 text-zinc-800'
                        : 'bg-black text-white font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <div className="text-[9px] text-zinc-400 mt-1 text-right">{m.timestamp}</div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] pl-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI đang xử lý...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-2.5 bg-zinc-50 border-t border-zinc-200 flex gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi về sản phẩm..."
              className="flex-1 bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="p-1.5 rounded-md bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
