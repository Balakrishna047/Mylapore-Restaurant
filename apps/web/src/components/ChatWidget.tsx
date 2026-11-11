'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { MessageSquare, X, Send, Bot, Sparkles, User as UserIcon } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  quickReplies?: string[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Vanakkam! 🙏 I am your **Mylapore Express AI Concierge**, powered by Salesforce Agentforce.\n\nHow can I help you today with our authentic South Indian culinary selections or your active order?',
      quickReplies: ['Track MYL-2026-1001', 'Blast-Chilled Freshness', 'Jain & Vegan Options', 'Reheating Guide']
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.chat(messageText);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.reply,
        quickReplies: response.quickReplies
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered a temporary connection issue. You can call us directly at (925) 238-3736.'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#1C1917] hover:bg-neutral-800 text-white rounded-full shadow-2xl border border-[#C8851A] hover:scale-105 transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-[#C8851A] flex items-center justify-center text-white text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wide">AI Concierge</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl w-[92vw] sm:w-96 h-[520px] max-h-[80vh] shadow-2xl border border-[#E7DFD5] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-[#FAF4E8] border-b border-[#E7DFD5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C8851A] flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1C1917]">Agentforce Concierge</h3>
                <span className="text-[10px] text-[#15803D] flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-ping" />
                  Online · Verified Grounding
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-black/5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF4E8]/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#D95338] text-white rounded-tr-xs'
                      : 'bg-white text-[#1C1917] border border-[#E7DFD5] rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Quick replies */}
                {msg.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => handleSend(qr)}
                        className="px-2.5 py-1 text-[10px] font-semibold bg-white hover:bg-[#FAF4E8] text-[#1C1917] border border-[#E7DFD5] rounded-full transition-colors"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#78716C] italic bg-white border border-[#E7DFD5] px-3 py-2 rounded-2xl w-fit">
                <span className="animate-spin">⏳</span> AI is looking up restaurant data...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-[#E7DFD5] bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about dishes, Jain, reheating..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[#FAF4E8]/60 border border-[#E7DFD5] rounded-xl focus:outline-hidden focus:border-[#C8851A]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-[#D95338] hover:bg-[#C84B31] disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
