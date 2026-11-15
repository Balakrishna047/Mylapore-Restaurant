'use client';

import React from 'react';
import { CategoryButton } from './chat.types';

interface CategoryButtonsProps {
  categories: CategoryButton[];
  onSelect: (slug: string, name: string) => void;
  disabled?: boolean;
}

export const CategoryButtons: React.FC<CategoryButtonsProps> = ({
  categories,
  onSelect,
  disabled
}) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2 pb-1">
      {categories.map((cat) => {
        const isUrl = cat.icon?.startsWith('http://') || cat.icon?.startsWith('https://') || cat.icon?.startsWith('/');

        return (
          <button
            key={cat.id || cat.slug}
            type="button"
            onClick={() => onSelect(cat.slug, cat.name)}
            disabled={disabled}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 hover:bg-primary text-stone-800 hover:text-white border border-amber-300 hover:border-primary transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-2xs"
          >
            {isUrl ? (
              <img
                src={cat.icon}
                alt={cat.name}
                className="w-5 h-5 rounded-full object-cover border border-amber-300/80 group-hover:border-white/80 transition-colors"
                loading="lazy"
              />
            ) : (
              <span className="text-sm">{cat.icon || '🍲'}</span>
            )}
            <span className="font-semibold">{cat.name}</span>
            {cat.itemCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-200/80 group-hover:bg-white/30 text-stone-700 group-hover:text-white rounded-full font-bold transition-colors">
                {cat.itemCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryButtons;
