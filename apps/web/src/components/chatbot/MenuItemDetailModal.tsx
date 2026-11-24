'use client';

import React, { useState } from 'react';
import { MenuItemDetailData } from './chat.types';
import { X, Flame, AlertTriangle, Snowflake, Sparkles, Utensils, Plus, Check, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

interface MenuItemDetailModalProps {
  item: MenuItemDetailData | null;
  onClose: () => void;
}

export const MenuItemDetailModal: React.FC<MenuItemDetailModalProps> = ({ item, onClose }) => {
  const { addItem, openCart } = useCart();
  const { success } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!item) return null;

  const handleAddToCart = async () => {
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
      }, false);

      setIsAdded(true);
      if (success) {
        success('Added to Cart', `${item.name} (${item.priceFormatted})`);
      }
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      console.error('Error adding to cart from modal:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#FFFDF9] rounded-2xl shadow-2xl border border-amber-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 w-full bg-amber-100/50">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🛕
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close Dish Details"
            className="absolute top-3 right-3 p-2 rounded-full bg-amber-900/80 text-white hover:bg-amber-950 transition-colors shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="text-sm font-bold bg-primary text-white px-3 py-1 rounded-md shadow border border-white/20">
              {item.priceFormatted}
            </span>
            {item.isBlastChilled && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-blue-900/90 text-blue-100 px-2.5 py-1 rounded-md backdrop-blur-sm border border-blue-400/30">
                <Snowflake className="w-3.5 h-3.5 text-blue-300" /> Blast-Chilled Fresh
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {item.categoryName}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                <Flame className="w-3.5 h-3.5 text-red-500" /> Spice: {item.spiceLevel}
              </span>
            </div>
            <h3 className="font-serif font-bold text-2xl text-stone-900 mt-1">
              {item.name}
            </h3>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Dietary Tags */}
          {item.dietaryTags?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Dietary Compatibility
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.dietaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300"
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
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-700" /> Authentic Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="text-xs px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-200"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergens Warning */}
          {item.allergens && item.allergens.length > 0 ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <strong className="font-bold">Allergen Notice:</strong> Contains{' '}
                {item.allergens.join(', ')}. Prepared in an authentic South Indian kitchen with sesame, dairy, and mustard.
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              ✓ No common allergens declared for this dish.
            </div>
          )}

          {/* Reheating & Nutrition */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-amber-200/90 space-y-2 text-xs">
            {item.nutritionServing && (
              <div className="flex items-center justify-between text-stone-700">
                <span className="font-semibold">Standard Portion:</span>
                <span>{item.nutritionServing}</span>
              </div>
            )}
            {item.reheatingInstructions && (
              <div className="pt-2 border-t border-amber-200 text-stone-600">
                <strong className="font-bold text-stone-800 block mb-1">
                  Reheating Instructions:
                </strong>
                <p className="leading-relaxed">{item.reheatingInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-200 bg-[#FAF7F2] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-primary hover:bg-primary-dark text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-white" /> Added to Cart!
              </>
            ) : isAdding ? (
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Add to Cart • {item.priceFormatted}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetailModal;
