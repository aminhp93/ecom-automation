'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';

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
        'Xin chào! Tôi là AI Ecom Analyst. Bạn có thể hỏi tôi bất kỳ điều gì về các sản phẩm vừa crawl, yêu cầu so sánh margin, góc quảng cáo, hoặc tư vấn chiến lược test sản phẩm.',
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
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-semibold text-xs flex items-center gap-2 shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-all"
        >
          <Bot className="w-4 h-4" />
          <span>Hỏi AI Analyst</span>
          <span className="w-2 h-2 rounded-full bg-black/60 animate-pulse"></span>
        </button>
      )}

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-[#0c0e15] border border-[#23283d] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#111420] border-b border-[#1e2333] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  AI Ecom Analyst
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => {
              const isBot = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                      isBot ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${
                      isBot
                        ? 'bg-[#141724] border border-[#202538] text-slate-200'
                        : 'bg-emerald-600 text-black font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <div className="text-[9px] text-slate-400 mt-1 text-right">{m.timestamp}</div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI đang phân tích danh mục sản phẩm...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-[#111420] border-t border-[#1e2333] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về sản phẩm, margin, góc ad..."
              className="flex-1 bg-[#151928] border border-[#23293d] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
