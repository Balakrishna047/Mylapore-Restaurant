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
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white border-b border-amber-900/40 rounded-t-2xl shadow-md">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amber-600/30 border border-amber-400/30 text-amber-300 font-serif text-lg font-bold shadow-inner">
          🛕
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-stone-900 rounded-full" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h3 className="font-serif font-bold text-base tracking-wide text-amber-100">
              Mylapore Concierge
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/40">
              <ShieldCheck className="w-3 h-3" /> Grounded
            </span>
          </div>
          <p className="text-xs text-amber-200/80">
            South Indian Culinary & Dietary Guide
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-amber-200/80">
        <button
          onClick={onReset}
          title="Restart Conversation"
          aria-label="Restart Conversation"
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onMinimize}
          title={isMinimized ? 'Expand' : 'Minimize'}
          aria-label={isMinimized ? 'Expand' : 'Minimize'}
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors hidden sm:inline-flex"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          title="Close Concierge"
          aria-label="Close Concierge"
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
