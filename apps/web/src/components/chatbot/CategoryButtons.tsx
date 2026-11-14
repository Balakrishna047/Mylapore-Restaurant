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
      {categories.map((cat) => (
        <button
          key={cat.id || cat.slug}
          onClick={() => onSelect(cat.slug, cat.name)}
          disabled={disabled}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 hover:border-primary hover:bg-primary/10 text-stone-800 dark:text-stone-200 hover:text-primary transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          <span className="text-sm">{cat.icon || '🍲'}</span>
          <span>{cat.name}</span>
          {cat.itemCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-full font-semibold">
              {cat.itemCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
