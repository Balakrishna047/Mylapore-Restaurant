'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface QuickPrompt {
  label: string;
  text: string;
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  quickPrompts?: QuickPrompt[];
  placeholder?: string;
}

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { label: '🥞 Breakfast Tiffins', text: 'Show Breakfast Tiffins' },
  { label: '🌱 Vegan Options', text: 'Show vegan options' },
  { label: '✨ Jain Specials', text: 'Show Jain options' },
  { label: '☕ Filter Coffee', text: 'Show authentic South Indian beverages' }
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  quickPrompts = DEFAULT_PROMPTS,
  placeholder = 'Ask about dosas, vegan dishes, ingredients...'
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  return (
    <div className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      {/* Quick Prompts Bar */}
      {quickPrompts && quickPrompts.length > 0 && (
        <div className="px-3 py-1.5 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/30 overflow-x-auto scrollbar-none flex gap-1.5 flex-nowrap">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(p.text)}
              disabled={isLoading}
              className="flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-stone-850 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-750 transition-colors active:scale-95 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Field & Submit Button */}
      <form onSubmit={handleSubmit} className="p-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          maxLength={500}
          aria-label="Ask about menu items, diet filters or dish details"
          className="flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          aria-label="Send message"
          className="p-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
