import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../services/api';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  RefreshCw,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { VietnameseEmblem } from './VietnameseEmblem';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin kính chào đồng chí! Tôi là **Trợ lý AI DeepSeek** của UBND xã Nghĩa Lâm.\n\nTôi có thể hỗ trợ đồng chí tra cứu quy định, cách tính điểm theo **Nghị định 335/2025/NĐ-CP**, tiêu chuẩn xếp loại và hỗ trợ soạn thảo văn bản hành chính. Đồng chí cần hỗ trợ gì hôm nay?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiApi.chatWithAI({
        message: userMsg.content,
        history,
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        source: res.source,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Xin lỗi đồng chí, tạm thời kết nối tới máy chủ AI gặp gián đoạn. Đồng chí vui lòng thử lại sau ít phút.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Cách tính điểm theo Nghị định 335?',
    'Tiêu chuẩn xếp loại Loại A (Xuất sắc)?',
    'Quy trình đánh giá 3 cấp tuần tự?',
    'Hệ số quy đổi sản phẩm là gì?',
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* 1. Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-[#27A4F2] via-[#3EAEF4] to-[#4585E6] hover:from-[#1864AB] hover:to-[#27A4F2] text-white rounded-full shadow-2xl shadow-[#27A4F2]/30 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-[#CFEBFC]/40"
        >
          <div className="absolute -inset-1 bg-[#27A4F2]/30 rounded-full blur-md opacity-75 group-hover:opacity-100 transition animate-pulse" />
          <div className="relative flex items-center space-x-2">
            <div className="p-1 rounded-full bg-white/20 text-yellow-200">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <span className="font-bold text-xs md:text-sm tracking-wide">Trợ Lý AI DeepSeek</span>
          </div>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9FD7F9] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </button>
      )}

      {/* 2. Slide-over Chat Box */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl shadow-[#27A4F2]/15 border border-[#CFEBFC] overflow-hidden flex flex-col transition-all duration-300 animate-fade-in ${
            isExpanded ? 'w-[90vw] md:w-[680px] h-[85vh]' : 'w-[90vw] sm:w-[420px] h-[560px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0C3260] via-[#1864AB] to-[#27A4F2] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#9FD7F9]/30">
            <div className="flex items-center space-x-2.5">
              <VietnameseEmblem size={32} />
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-black text-xs md:text-sm tracking-wide uppercase">
                    TRỢ LÝ AI DEEPSEEK
                  </h3>
                  <span className="bg-white/20 text-[#CFEBFC] border border-[#9FD7F9]/40 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                    NĐ 335
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-[#CFEBFC]/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Trực tuyến 24/7 • UBND xã Nghĩa Lâm</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                className="p-1 text-yellow-100/80 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ"
                className="p-1 text-yellow-100/80 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2.5 ${
                  m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-xs ${
                    m.role === 'user'
                      ? 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                      : 'bg-gradient-to-tr from-red-700 to-amber-700'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">{m.content}</div>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      m.role === 'user' ? 'text-sky-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-500 bg-white p-3 rounded-2xl border border-slate-200/80 w-fit">
                <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                <span className="text-[11px] font-medium">DeepSeek AI đang suy nghĩ câu trả lời...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center space-x-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-400 font-bold flex-shrink-0 flex items-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Gợi ý:</span>
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded-full whitespace-nowrap transition text-slate-700 font-medium shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Nhập câu hỏi về NĐ 335 hoặc văn bản hành chính..."
              className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-600 focus:border-transparent transition bg-slate-50 focus:bg-white"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
