'use client';

import React, { useRef, useEffect } from 'react';
import { User, AlertCircle, RefreshCw } from 'lucide-react';
import {
  ChatMessage,
  MenuItemCardData,
  MenuItemDetailData
} from './chat.types';
import { CategoryButtons } from './CategoryButtons';
import { MenuItemList } from './MenuItemList';
import { WelcomeScreen } from './WelcomeScreen';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSelectCategory: (categorySlug: string, categoryName: string) => void;
  onViewItemDetail: (item: MenuItemCardData) => void;
  onSelectDetailBlock: (detail: MenuItemDetailData) => void;
  onSelectPrompt: (promptText: string) => void;
  onResetChat: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  error,
  onSelectCategory,
  onViewItemDetail,
  onSelectDetailBlock,
  onSelectPrompt,
  onResetChat
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-950/40">
      {/* Show Welcome Screen if empty or first turn */}
      {messages.length === 0 && (
        <WelcomeScreen onSelectPrompt={onSelectPrompt} disabled={isLoading} />
      )}

      {/* Message History */}
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
                            onSelect={onSelectCategory}
                            disabled={isLoading}
                          />
                        );
                      }
                      if (block.type === 'menu_item_list' && block.payload?.items) {
                        return (
                          <MenuItemList
                            key={idx}
                            items={block.payload.items}
                            onViewDetails={onViewItemDetail}
                          />
                        );
                      }
                      if (block.type === 'menu_item_detail' && block.payload) {
                        return (
                          <button
                            key={idx}
                            onClick={() => onSelectDetailBlock(block.payload)}
                            className="w-full text-left p-3 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-stone-750 transition-colors block"
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
              onClick={onResetChat}
              className="flex items-center gap-1 font-bold underline mt-1 text-red-700 dark:text-red-300 hover:text-red-900"
            >
              <RefreshCw className="w-3 h-3" /> Reconnect Session
            </button>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
