'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Plus, Minus, Check, Star, Snowflake, Flame } from 'lucide-react';

interface DishCardProps {
  dish: {
    id: string;
    slug: string;
    name: string;
    description: string;
    basePrice: number;
    image: string;
    orderCountBadge?: string;
    categoryName?: string;
    category?: { name: string; slug?: string };
    spiceLevel?: string;
    dietaryTags?: string[] | string;
    isBlastChilled?: boolean;
    rating?: number;
    reviewCount?: number;
  };
  viewMode?: 'grid' | 'list';
}

export default function DishCard({ dish, viewMode = 'grid' }: DishCardProps) {
  const { addItem, cart, updateQuantity } = useCart();
  const [imgSrc, setImgSrc] = useState(dish.image || '/images/placeholder-dish.svg');
  const [isAdding, setIsAdding] = useState(false);

  // Sync image source whenever dish prop updates (e.g. category filter or search)
  React.useEffect(() => {
    if (dish?.image) {
      setImgSrc(dish.image);
    } else {
      setImgSrc('/images/placeholder-dish.svg');
    }
  }, [dish?.image]);

  // Graceful fallback: If Cloudinary fails or is offline, show styled SVG placeholder
  const handleImageError = () => {
    if (imgSrc !== '/images/placeholder-dish.svg') {
      setImgSrc('/images/placeholder-dish.svg');
    }
  };

  const cartItem = cart?.items?.find((i: any) => i.menuItemId === dish.id);
  const currentQty = cartItem?.quantity || 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await addItem({
        menuItemId: dish.id,
        quantity: 1
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      await updateQuantity(cartItem.id, currentQty + 1);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      await updateQuantity(cartItem.id, Math.max(0, currentQty - 1));
    }
  };

  const categoryLabel = (dish.categoryName || dish.category?.name || 'CURRIES').toUpperCase();

  // Parse dietary tags
  const tags: string[] = Array.isArray(dish.dietaryTags)
    ? dish.dietaryTags
    : typeof dish.dietaryTags === 'string'
    ? (() => {
        try {
          return JSON.parse(dish.dietaryTags);
        } catch {
          return [];
        }
      })()
    : [];

  const isVegan = tags.includes('VEGAN');
  const isJain = tags.includes('JAIN');
  const isGF = tags.includes('GLUTEN_FREE');

  // List View
  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-2xl border border-[#E7DFD5] p-4 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-44 aspect-[3/2] sm:h-auto shrink-0 rounded-xl overflow-hidden bg-[#FAF4E8]">
          <Link href={`/products/${dish.slug}`}>
            <img
              src={imgSrc}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-[9px] font-bold uppercase tracking-wider text-[#78716C] px-2 py-0.5 rounded-sm shadow-xs border border-white/60">
            {categoryLabel}
          </div>
          {dish.isBlastChilled && (
            <div className="absolute bottom-2 left-2 bg-[#1C1917]/85 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Snowflake className="w-2.5 h-2.5 text-sky-400" />
              <span>38°F Chilled</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between w-full space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link href={`/products/${dish.slug}`} className="hover:text-[#C8851A] transition-colors">
                <h3 className="font-serif font-bold text-base text-[#1C1917]">{dish.name}</h3>
              </Link>
              {isVegan && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-sm font-semibold">VEGAN</span>}
              {isJain && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-sm font-semibold">JAIN</span>}
              {isGF && <span className="text-[10px] bg-neutral-50 text-neutral-600 border border-neutral-200 px-1.5 py-0.2 rounded-sm font-semibold">GLUTEN-FREE</span>}
            </div>
            <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed">{dish.description}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#F5EFE6]">
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-lg text-[#1C1917]">${dish.basePrice.toFixed(2)}</span>
              {dish.orderCountBadge && (
                <span className="text-[11px] text-[#A8A29E] font-medium hidden sm:inline">· {dish.orderCountBadge}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/products/${dish.slug}`}
                className="px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-[#FAF4E8] hover:bg-[#EAE2D5] rounded-xl border border-[#E7DFD5] transition-colors"
              >
                View details
              </Link>
              {currentQty > 0 ? (
                <div className="flex items-center gap-2 bg-[#1C1917] text-white rounded-xl px-2 py-1 shadow-xs">
                  <button onClick={handleDecrement} className="p-1 hover:text-[#D95338] transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{currentQty}</span>
                  <button onClick={handleIncrement} className="p-1 hover:text-[#D95338] transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleQuickAdd}
                  disabled={isAdding}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#D95338] hover:bg-[#C84B31] rounded-xl shadow-xs transition-colors"
                >
                  {isAdding ? 'Adding...' : '+ Add'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="group bg-white rounded-2xl border border-[#E7DFD5] overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Image Container with Badges - 3:2 aspect ratio matching authentic 448x298 photo dimensions */}
      <div className="relative aspect-[3/2] overflow-hidden bg-[#FAF4E8]">
        <Link href={`/products/${dish.slug}`}>
          <img
            src={imgSrc}
            alt={dish.name}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Category Pill Badge on top left */}
        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-[9px] font-bold uppercase tracking-wider text-[#78716C] px-2 py-0.5 rounded-sm shadow-xs border border-white/60">
          {categoryLabel}
        </div>

        {/* Quick Add / In Cart Badge on top right */}
        {currentQty > 0 ? (
          <div className="absolute top-2.5 right-2.5 bg-[#1C1917] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-in zoom-in-75">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>{currentQty} in cart</span>
          </div>
        ) : (
          <button
            onClick={handleQuickAdd}
            title="Quick add to Cart"
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-[#D95338] text-[#1C1917] hover:text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Order Count Badge on bottom left */}
        {dish.orderCountBadge && (
          <div className="absolute bottom-2 left-2 bg-[#1C1917]/85 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <span className="text-[10px]">📈</span>
            <span>{dish.orderCountBadge}</span>
          </div>
        )}

        {/* Blast-chilled badge bottom right */}
        {dish.isBlastChilled && (
          <div className="absolute bottom-2 right-2 bg-sky-950/80 backdrop-blur-xs text-sky-200 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <Snowflake className="w-2.5 h-2.5 text-sky-400" />
            <span>38°F</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-white">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <Link href={`/products/${dish.slug}`} className="hover:text-[#C8851A] transition-colors block flex-1">
              <h3 className="font-serif font-bold text-sm text-[#1C1917] line-clamp-1">
                {dish.name}
              </h3>
            </Link>
            <span className="font-serif font-bold text-sm text-[#1C1917] shrink-0">
              ${dish.basePrice.toFixed(2)}
            </span>
          </div>

          <p className="text-[11px] text-[#78716C] line-clamp-2 leading-relaxed mb-2.5">
            {dish.description}
          </p>

          {/* Dietary Micro Badges */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {isVegan && (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded-xs font-semibold">
                VEGAN
              </span>
            )}
            {isJain && (
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded-xs font-semibold">
                JAIN
              </span>
            )}
            {isGF && (
              <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded-xs font-semibold">
                GLUTEN-FREE
              </span>
            )}
            {dish.spiceLevel === 'SPICY' && (
              <span className="text-[9px] text-[#D95338] font-bold flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" /> Hot
              </span>
            )}
          </div>
        </div>

        {/* Bottom Actions: View Item & Inline Cart Buttons */}
        <div className="pt-2 border-t border-[#F5EFE6] flex items-center gap-2">
          <Link
            href={`/products/${dish.slug}`}
            className="flex-1 py-1.5 text-center text-xs font-semibold text-[#1C1917] bg-[#FAF4E8] hover:bg-[#EAE2D5] rounded-xl border border-[#E7DFD5] transition-colors"
          >
            View item
          </Link>

          {currentQty > 0 ? (
            <div className="flex items-center gap-1 bg-[#1C1917] text-white rounded-xl p-0.5 shadow-xs shrink-0">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:text-[#D95338] active:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Decrease quantity"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold w-5 text-center select-none">{currentQty}</span>
              <button
                onClick={handleIncrement}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:text-[#D95338] active:bg-white/10 active:scale-95 transition-all cursor-pointer"
                aria-label="Increase quantity"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="min-h-[32px] px-3.5 py-1.5 text-xs font-bold text-white bg-[#D95338] hover:bg-[#C84B31] active:bg-[#B33E26] rounded-xl shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
              aria-label={`Add ${dish.name} to cart`}
              title="Add 1 to cart"
            >
              {isAdding ? '...' : '+ Add'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
