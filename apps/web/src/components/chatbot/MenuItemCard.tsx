'use client';

import React, { useState } from 'react';
import { MenuItemCardData } from './chat.types';
import { Flame, Snowflake, Info, Plus, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

interface MenuItemCardProps {
  item: MenuItemCardData;
  onViewDetails: (item: MenuItemCardData) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onViewDetails }) => {
  const { addItem, openCart } = useCart();
  const { success } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsAdding(true);
      const priceVal = item.priceMinor
        ? item.priceMinor / 100
        : parseFloat(item.priceFormatted?.replace(/[^0-9.]/g, '') || '0');

      await addItem({
        menuItemId: item.id,
        quantity: 1,
        name: item.name,
        price: priceVal,
        image: item.imageUrl,
        spiceLevel: item.spiceLevel
      });

      setIsAdded(true);
      if (success) {
        success('Added to Cart', `${item.name} (${item.priceFormatted})`);
      }
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

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

          {/* Action Buttons: Add to Cart & View Details */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-2xs ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary hover:bg-primary-dark text-white'
              } disabled:opacity-50`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" /> Added
                </>
              ) : isAdding ? (
                <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> + Add
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onViewDetails(item)}
              className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-stone-800 hover:text-primary border border-amber-300 transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
            >
              <Info className="w-3 h-3" /> Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
