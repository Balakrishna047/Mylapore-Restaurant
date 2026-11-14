'use client';

import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

interface ChatLauncherProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ChatLauncher: React.FC<ChatLauncherProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      aria-label="Open Mylapore Express Culinary Concierge"
      className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-700 via-primary to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 border border-amber-300/30 backdrop-blur-md"
    >
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white">
        <MessageCircle className="w-5 h-5 text-white" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
        </span>
      </div>
      <div className="flex flex-col text-left pr-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
          Mylapore Guide
        </span>
        <span className="text-sm font-bold leading-tight flex items-center gap-1">
          Ask Concierge <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </span>
      </div>
    </button>
  );
};
