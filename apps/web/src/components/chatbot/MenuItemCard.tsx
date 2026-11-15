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
    <div className="flex flex-col bg-white rounded-xl border border-amber-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 w-[240px] flex-shrink-0">
      <div className="relative h-28 w-full bg-amber-50 overflow-hidden">
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
          <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-semibold bg-blue-900/90 text-blue-100 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-400/30">
            <Snowflake className="w-2.5 h-2.5 text-blue-300" /> Blast-Chilled
          </span>
        )}
        <span className="absolute bottom-2 right-2 text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-md shadow border border-white/20">
          {item.priceFormatted}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-serif font-bold text-xs text-stone-900 line-clamp-1">
              {item.name}
            </h4>
            <span className="text-[10px] text-amber-700 font-medium px-1.5 py-0.2 bg-amber-100 rounded">
              {item.categoryName}
            </span>
          </div>
          <p className="text-[11px] text-stone-600 line-clamp-2 mt-1 leading-snug">
            {item.description}
          </p>
        </div>

        <div className="space-y-2 pt-1 border-t border-amber-100">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-stone-600 font-medium">
              <Flame className="w-2.5 h-2.5 text-red-500" /> {item.spiceLevel}
            </span>
            {item.orderCountBadge && (
              <span className="text-amber-700 font-semibold">
                {item.orderCountBadge}
              </span>
            )}
          </div>

          <button
            onClick={() => onViewDetails(item)}
            className="w-full py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-primary text-stone-800 hover:text-white border border-amber-300 hover:border-primary transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
          >
            <Info className="w-3 h-3" /> View Details & Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
