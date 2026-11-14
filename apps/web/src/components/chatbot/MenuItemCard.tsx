'use client';

import React from 'react';
import { MenuItemCardData } from './chat.types';
import { Flame, Snowflake, Info } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItemCardData;
  onViewDetails: (item: MenuItemCardData) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onViewDetails }) => {
  return (
    <div className="flex flex-col bg-white dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-700/70 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 w-[240px] flex-shrink-0">
      <div className="relative h-28 w-full bg-stone-150 dark:bg-stone-800 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍲
          </div>
        )}
        {item.isBlastChilled && (
          <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold bg-blue-900/90 text-blue-200 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-400/30">
            <Snowflake className="w-2.5 h-2.5 text-blue-300" /> Blast-Chilled
          </span>
        )}
        <span className="absolute bottom-2 right-2 text-xs font-bold bg-stone-900/90 text-amber-300 px-2 py-0.5 rounded-md backdrop-blur-sm shadow">
          {item.priceFormatted}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
              {item.name}
            </h4>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 leading-snug">
            {item.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {item.dietaryTags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
            >
              {tag}
            </span>
          ))}
          {item.spiceLevel && (
            <span className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
              <Flame className="w-2.5 h-2.5 text-red-500" /> {item.spiceLevel}
            </span>
          )}
        </div>

        <button
          onClick={() => onViewDetails(item)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-primary dark:text-amber-300 bg-amber-50 dark:bg-stone-800 hover:bg-primary hover:text-white dark:hover:bg-amber-600 dark:hover:text-stone-950 transition-all duration-200 border border-primary/20 dark:border-amber-500/20 active:scale-95"
        >
          <Info className="w-3.5 h-3.5" /> View Recipe Details
        </button>
      </div>
    </div>
  );
};
