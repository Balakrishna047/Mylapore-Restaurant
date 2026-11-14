'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMylaporeChat } from './useMylaporeChat';
import { ChatLauncher } from './ChatLauncher';
import { ChatHeader } from './ChatHeader';
import { CategoryButtons } from './CategoryButtons';
import { MenuItemList } from './MenuItemList';
import { MenuItemDetailModal } from './MenuItemDetailModal';
import {
  MenuItemCardData,
  MenuItemDetailData,
  ChatDisplayBlock
} from './chat.types';
import { Send, AlertCircle, RefreshCw, Bot, User } from 'lucide-react';

export const ChatWidget: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    messages,
    isLoading,
    error,
    selectedItemDetail,
    openChat,
    closeChat,
    toggleMinimize,
    sendMessage,
    selectCategory,
    viewItemDetail,
    setSelectedItemDetail,
    resetChat
  } = useMylaporeChat();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendMessage(inputText);
    setInputText('');
  };

  const quickPrompts = [
    { label: '🥞 Breakfast Tiffins', text: 'Show Breakfast Tiffins' },
    { label: '🌱 Vegan Options', text: 'Show vegan options' },
    { label: '✨ Jain Specials', text: 'Show Jain options' },
    { label: '☕ Filter Coffee', text: 'Show authentic South Indian beverages' }
  ];

  return (
    <>
      <ChatLauncher onClick={openChat} isOpen={isOpen} />

      {isOpen && (
        <div
          role="dialog"
          aria-label="Mylapore Express Culinary Chatbot"
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col ${
            isMinimized
              ? 'bottom-6 right-6 w-80 h-14'
              : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] h-full sm:h-[620px] max-h-[100vh] sm:max-h-[85vh]'
          } bg-white dark:bg-stone-900 rounded-none sm:rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden`}
        >
          {/* Header */}
          <ChatHeader
            onClose={closeChat}
            onMinimize={toggleMinimize}
            onReset={resetChat}
            isMinimized={isMinimized}
          />

          {!isMinimized && (
            <>
              {/* Message History Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-950/40">
                {messages.map((msg) => {
                  const isAgent = msg.sender === 'agent';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-start gap-2 max-w-[90%]">
                        {isAgent && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-700 to-primary text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 mt-0.5">
                            🛕
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isAgent
                              ? 'bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-750 shadow-sm rounded-tl-sm'
                              : 'bg-primary text-white shadow-sm rounded-tr-sm'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.text}</div>

                          {/* Render verified Display Blocks */}
                          {msg.displayBlocks && msg.displayBlocks.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {msg.displayBlocks.map((block, idx) => {
                                if (block.type === 'category_buttons' && block.payload?.categories) {
                                  return (
                                    <CategoryButtons
                                      key={idx}
                                      categories={block.payload.categories}
                                      onSelect={selectCategory}
                                      disabled={isLoading}
                                    />
                                  );
                                }
                                if (block.type === 'menu_item_list' && block.payload?.items) {
                                  return (
                                    <MenuItemList
                                      key={idx}
                                      items={block.payload.items}
                                      onViewDetails={viewItemDetail}
                                    />
                                  );
                                }
                                if (block.type === 'menu_item_detail' && block.payload) {
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedItemDetail(block.payload)}
                                      className="w-full text-left p-3 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 transition-colors block"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100">
                                          {block.payload.name}
                                        </span>
                                        <span className="font-bold text-xs text-primary dark:text-amber-300">
                                          {block.payload.priceFormatted}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1 mt-0.5">
                                        {block.payload.description}
                                      </p>
                                      <span className="text-[10px] text-primary dark:text-amber-400 font-semibold underline mt-1 block">
                                        Click to view full recipe & allergen matrix →
                                      </span>
                                    </button>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                        </div>
                        {!isAgent && (
                          <div className="w-7 h-7 rounded-full bg-stone-700 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-1 px-9">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs px-2 py-1">
                    <div className="w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 flex items-center justify-center text-xs font-bold">
                      🛕
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-[11px] text-stone-500 font-medium pl-1">
                        Consulting Mylapore kitchen catalog...
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-start gap-2 text-xs text-red-800 dark:text-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{error}</span>
                      <button
                        onClick={resetChat}
                        className="flex items-center gap-1 font-bold underline mt-1 text-red-700 dark:text-red-300 hover:text-red-900"
                      >
                        <RefreshCw className="w-3 h-3" /> Reconnect Session
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-3 py-1.5 border-t border-stone-100 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm overflow-x-auto scrollbar-none flex gap-1.5 flex-nowrap">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(p.text)}
                    disabled={isLoading}
                    className="flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSubmit}
                className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about dosas, vegan dishes, ingredients..."
                  disabled={isLoading}
                  maxLength={500}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  aria-label="Send message"
                  className="p-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      <MenuItemDetailModal
        item={selectedItemDetail}
        onClose={() => setSelectedItemDetail(null)}
      />
    </>
  );
};
export default ChatWidget;
