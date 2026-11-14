'use client';

import React from 'react';
import { MenuItemDetailData } from './chat.types';
import { X, Flame, AlertTriangle, Snowflake, Sparkles, Utensils } from 'lucide-react';

interface MenuItemDetailModalProps {
  item: MenuItemDetailData | null;
  onClose: () => void;
}

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-amber-900/20 dark:border-stone-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 w-full bg-stone-200 dark:bg-stone-800">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🍛
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close Dish Details"
            className="absolute top-3 right-3 p-2 rounded-full bg-stone-900/80 text-white hover:bg-stone-950 transition-colors shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="text-sm font-bold bg-stone-950/90 text-amber-300 px-3 py-1 rounded-md backdrop-blur-sm shadow border border-amber-500/20">
              {item.priceFormatted}
            </span>
            {item.isBlastChilled && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-blue-950/90 text-blue-200 px-2.5 py-1 rounded-md backdrop-blur-sm border border-blue-400/30">
                <Snowflake className="w-3.5 h-3.5 text-blue-300" /> Blast-Chilled Fresh
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary dark:text-amber-400">
                {item.categoryName}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Flame className="w-3.5 h-3.5 text-red-500" /> Spice: {item.spiceLevel}
              </span>
            </div>
            <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 mt-1">
              {item.name}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Dietary Tags */}
          {item.dietaryTags?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                Dietary Compatibility
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.dietaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                  >
                    🌱 {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                <Utensils className="w-3.5 h-3.5" /> Authentic Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="text-xs px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergens Warning */}
          {item.allergens && item.allergens.length > 0 ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <strong className="font-bold">Allergen Notice:</strong> Contains{' '}
                {item.allergens.join(', ')}. Prepared in an authentic South Indian kitchen with sesame, dairy, and mustard.
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
              ✓ No common major allergens reported for this dish.
            </div>
          )}

          {/* Reheating Instructions */}
          {item.reheatingInstructions && (
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 text-xs">
              <strong className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                Fresh Reheating Guidelines:
              </strong>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                {item.reheatingInstructions}
              </p>
            </div>
          )}

          {/* Nutrition & Serving */}
          {item.nutritionServing && (
            <div className="text-xs text-stone-500 dark:text-stone-400 italic">
              Portion size: {item.nutritionServing}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 hover:bg-stone-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
