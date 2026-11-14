'use client';

import React from 'react';
import { MenuItemCardData } from './chat.types';
import { MenuItemCard } from './MenuItemCard';

interface MenuItemListProps {
  items: MenuItemCardData[];
  onViewDetails: (item: MenuItemCardData) => void;
}

export const MenuItemList: React.FC<MenuItemListProps> = ({ items, onViewDetails }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="pt-2 pb-1">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} onViewDetails={onViewDetails} />
        ))}
      </div>
    </div>
  );
};
