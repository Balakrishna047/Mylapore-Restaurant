'use client';

import React from 'react';
import { X, Minus, RotateCcw, ShieldCheck } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  onReset: () => void;
  isMinimized: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClose,
  onMinimize,
  onReset,
  isMinimized
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-700 via-primary to-orange-700 text-white border-b border-amber-600/30 rounded-t-2xl shadow-md">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/20 border border-amber-200/40 text-amber-100 font-serif text-lg font-bold shadow-inner">
          🛕
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-amber-700 rounded-full" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif font-bold text-base tracking-wide text-white">
              Mylapore Concierge
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
              <ShieldCheck className="w-3 h-3" /> Grounded
            </span>
          </div>
          <p className="text-xs text-amber-100/90 font-medium">
            South Indian Culinary & Dietary Guide
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-white/90">
        <button
          onClick={onReset}
          title="Restart Conversation"
          aria-label="Restart Conversation"
          className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onMinimize}
          title={isMinimized ? 'Expand' : 'Minimize'}
          aria-label={isMinimized ? 'Expand' : 'Minimize'}
          className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors hidden sm:inline-flex"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          title="Close Concierge"
          aria-label="Close Concierge"
          className="p-1.5 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
