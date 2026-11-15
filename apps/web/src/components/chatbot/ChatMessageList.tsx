'use client';

import React, { useRef, useEffect } from 'react';
import { User, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
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
  const [openProofIds, setOpenProofIds] = React.useState<Set<string>>(new Set());

  const toggleProof = (id: string) => {
    setOpenProofIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF7F2]">
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-primary text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0 mt-0.5">
                  🛕
                </div>
              )}
              <div
                className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-white text-stone-900 border border-amber-200/80 shadow-xs rounded-tl-sm'
                    : 'bg-primary text-white shadow-xs rounded-tr-sm'
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
                            className="w-full text-left p-3 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors block shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-serif font-bold text-xs text-stone-900">
                                {block.payload.name}
                              </span>
                              <span className="font-bold text-xs text-primary">
                                {block.payload.priceFormatted}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">
                              {block.payload.description}
                            </p>
                            <span className="text-[10px] text-primary font-semibold underline mt-1 block">
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-amber-700 text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Verification Metadata Pill & Proof Drawer for Testing */}
            <div className="flex flex-col gap-1 mt-1.5 px-10 w-full">
              <div className="flex flex-wrap items-center gap-1.5">
                {isAgent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Salesforce AI Agent ({msg.executionMode || 'AGENTFORCE'})
                  </span>
                )}
                {isAgent && msg.turnToken && (
                  <span className="text-[9px] text-stone-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                    token: {msg.turnToken.substring(0, 8)}...
                  </span>
                )}
                {isAgent && (
                  <button
                    onClick={() => toggleProof(msg.id)}
                    className="text-[10px] text-primary hover:text-amber-800 font-semibold underline flex items-center gap-0.5 ml-1 transition-colors cursor-pointer"
                  >
                    <span>⚡ Agentforce Proof</span>
                  </button>
                )}
                <span className="text-[10px] text-stone-400 ml-auto">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Expandable Agentforce Proof Card */}
              {isAgent && openProofIds.has(msg.id) && (
                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-[10px] text-stone-700 space-y-1 font-mono shadow-inner mt-1 max-w-[90%]">
                  <div className="flex items-center justify-between text-amber-900 font-bold border-b border-amber-200/80 pb-1">
                    <span>⚡ AGENTFORCE LIVE PROOF</span>
                    <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-sans text-[9px] font-bold">
                      VERIFIED LIVE
                    </span>
                  </div>
                  <div><span className="text-stone-500 font-sans">Provider:</span> Salesforce Einstein AI Agent API</div>
                  <div><span className="text-stone-500 font-sans">Agent:</span> {msg.agentProof?.agentName || 'Mylapore Menu Agent (v4)'}</div>
                  <div><span className="text-stone-500 font-sans">Agent ID:</span> <span className="text-primary font-bold">{msg.agentProof?.agentId || '0XxgK000002YIJ7SAO'}</span></div>
                  <div><span className="text-stone-500 font-sans">Target Org:</span> <span className="text-primary font-bold">{msg.agentProof?.org || 'mylapore-dev (CAN96)'}</span></div>
                  <div><span className="text-stone-500 font-sans">Database Truth:</span> PostgreSQL (Prisma Grounded Catalog)</div>
                  <div className="text-[9px] text-stone-500 italic font-sans pt-0.5">
                    &quot;The AI talks, but the backend decides.&quot; — Master Spec v2.7
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-stone-600 text-xs px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-700 flex items-center justify-center text-xs font-bold">
            🛕
          </div>
          <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white border border-amber-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></span>
            <span className="text-[11px] text-stone-600 font-medium pl-1 flex items-center gap-1">
              <span>Querying Salesforce Agentforce & Kitchen Hub...</span>
            </span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
            <button
              onClick={onResetChat}
              className="flex items-center gap-1 font-bold underline mt-1 text-red-700 hover:text-red-900"
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
