'use client';

import React from 'react';
import { Sparkles, Utensils, Snowflake } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectPrompt, disabled }) => {
  const starterChips = [
    { label: '🍱 South Indian Meals', query: 'i want meals' },
    { label: '🥞 Breakfast Tiffins', query: 'Show Breakfast Tiffins' },
    { label: '🌱 Vegan Specials', query: 'Show vegan options' },
    { label: '✨ Jain Dishes', query: 'Show Jain options' },
    { label: '☕ Filter Coffee', query: 'Show authentic South Indian beverages' },
    { label: '🌶️ Spice Levels', query: 'What spice levels do you offer?' },
    { label: '❄️ Blast-Chilled Freshness', query: 'Tell me about blast-chilled freshness' }
  ];

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50/60 border border-amber-200/80 shadow-xs text-center space-y-3">
      <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-amber-700 to-primary text-white flex items-center justify-center text-xl shadow-md">
        🛕
      </div>

      <div>
        <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900">
          Namaskaram!
        </h3>
        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
          Welcome to <span className="font-semibold text-primary">Mylapore Express</span>. I am your culinary concierge. How may I guide your South Indian feast today?
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 text-[11px] text-stone-600 pt-1 border-t border-amber-100">
        <span className="flex items-center gap-1 font-medium">
          <Snowflake className="w-3 h-3 text-blue-500" /> Blast-Chilled
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 font-medium">
          <Utensils className="w-3 h-3 text-amber-700" /> Pure Vegetarian
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-primary" /> Temple Authentic
        </span>
      </div>

      <div className="pt-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 block mb-2">
          Suggested Inquiries
        </span>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {starterChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(chip.query)}
              disabled={disabled}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white border border-amber-200 hover:border-primary hover:text-primary text-stone-700 transition-all active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
