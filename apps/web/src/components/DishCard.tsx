'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Plus, Minus, Check, Snowflake, Flame } from 'lucide-react';
import { MenuItemDto } from '@mylapore/shared-types';

export interface DishCardProps {
  dish: Partial<MenuItemDto> & {
    id: string;
    slug: string;
    name: string;
    description: string;
    basePrice: number;
    image: string;
    orderCountBadge?: string;
    categoryName?: string;
    category?: { name: string; slug?: string };
    spiceLevel?: any;
    dietaryTags?: any;
    isBlastChilled?: boolean;
    rating?: number;
    reviewCount?: number;
  };
  viewMode?: 'grid' | 'list';
}

// Helper to inject Cloudinary on-the-fly thumbnail scaling (resizes to 500px, cutting payload from 200KB down to ~15KB for immediate display)
const optimizeCloudinaryUrl = (url?: string) => {
  if (!url) return '/images/placeholder-dish.svg';
  if (url.includes('res.cloudinary.com') && !url.includes('w_')) {
    return url.replace('/upload/', '/upload/w_500,c_scale/');
  }
  return url;
};

export default function DishCard({ dish, viewMode = 'grid' }: DishCardProps) {
  const { addItem, cart, updateQuantity, openCart } = useCart();
  const toast = useToast();
  const [imgSrc, setImgSrc] = useState(optimizeCloudinaryUrl(dish.image));
  const [isAdding, setIsAdding] = useState(false);

  React.useEffect(() => {
    setImgSrc(optimizeCloudinaryUrl(dish?.image));
  }, [dish?.image]);

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
    toast.success('Added to Cart', `${dish.name} added to your order.`);
    try {
      await addItem({
        menuItemId: dish.id || dish.slug,
        quantity: 1,
        name: dish.name,
        image: dish.image,
        price: dish.basePrice,
        spiceLevel: dish.spiceLevel || 'MEDIUM',
      });
    } catch {
      toast.error('Could not add dish', 'Please try again in a moment.');
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
      <div className="group bg-surface rounded-2xl border border-border p-4 hover:border-accent hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-44 aspect-[3/2] sm:h-auto shrink-0 rounded-xl overflow-hidden bg-surface-muted">
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
          <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur-xs text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-sm shadow-xs border border-border">
            {categoryLabel}
          </div>
          {dish.isBlastChilled && (
            <div className="absolute bottom-2 left-2 bg-foreground/85 backdrop-blur-xs text-background text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Snowflake className="w-2.5 h-2.5 text-sky-400" />
              <span>38°F Chilled</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between w-full space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link href={`/products/${dish.slug}`} className="hover:text-accent transition-colors">
                <h3 className="font-serif font-bold text-base text-foreground">{dish.name}</h3>
              </Link>
              {isVegan && <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-xs font-semibold">VEGAN</span>}
              {isJain && <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-xs font-semibold">JAIN</span>}
              {isGF && <span className="text-[10px] bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 px-1.5 py-0.5 rounded-xs font-semibold">GLUTEN-FREE</span>}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{dish.description}</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-lg text-foreground">${dish.basePrice.toFixed(2)}</span>
              {dish.orderCountBadge && (
                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">· {dish.orderCountBadge}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/products/${dish.slug}`}
                className="px-3 py-1.5 text-xs font-semibold text-foreground bg-surface-muted hover:bg-surface-subtle rounded-xl border border-border transition-colors min-h-[38px] flex items-center"
              >
                View details
              </Link>
              {currentQty > 0 ? (
                <div className="flex items-center gap-1.5 bg-foreground text-background rounded-xl px-2 py-1 shadow-xs min-h-[38px]">
                  <button onClick={handleDecrement} className="p-1 hover:text-primary transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer" aria-label="Decrease">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center select-none">{currentQty}</span>
                  <button onClick={handleIncrement} className="p-1 hover:text-primary transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer" aria-label="Increase">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleQuickAdd}
                  disabled={isAdding}
                  className="px-4 py-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary-hover active:scale-[0.98] rounded-xl shadow-xs transition-all min-h-[38px] cursor-pointer"
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
    <div className="group bg-surface rounded-2xl border border-border overflow-hidden hover:border-accent hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Image Container with Badges */}
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-muted">
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
        <div className="absolute top-2.5 left-2.5 bg-surface/90 backdrop-blur-xs text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-sm shadow-xs border border-border">
          {categoryLabel}
        </div>

        {/* Quick Add / In Cart Badge on top right */}
        {currentQty > 0 ? (
          <div className="absolute top-2.5 right-2.5 bg-foreground text-background text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-in zoom-in-75">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>{currentQty} in cart</span>
          </div>
        ) : (
          <button
            onClick={handleQuickAdd}
            title="Quick add to Cart"
            aria-label={`Add ${dish.name} to cart`}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/90 hover:bg-primary text-foreground hover:text-primary-foreground flex items-center justify-center shadow-xs transition-all active:scale-[0.95] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Order Count Badge on bottom left */}
        {dish.orderCountBadge && (
          <div className="absolute bottom-2 left-2 bg-foreground/85 backdrop-blur-xs text-background text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <span className="text-[10px]">📈</span>
            <span>{dish.orderCountBadge}</span>
          </div>
        )}

        {/* Blast-chilled badge bottom right */}
        {dish.isBlastChilled && (
          <div className="absolute bottom-2 right-2 bg-sky-950/85 backdrop-blur-xs text-sky-200 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <Snowflake className="w-2.5 h-2.5 text-sky-400" />
            <span>38°F</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-surface">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <Link href={`/products/${dish.slug}`} className="hover:text-accent transition-colors block flex-1">
              <h3 className="font-serif font-bold text-sm text-foreground line-clamp-1">
                {dish.name}
              </h3>
            </Link>
            <span className="font-serif font-bold text-sm text-foreground shrink-0">
              ${dish.basePrice.toFixed(2)}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2.5">
            {dish.description}
          </p>

          {/* Dietary Micro Badges */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {isVegan && (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-xs font-semibold">
                VEGAN
              </span>
            )}
            {isJain && (
              <span className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-xs font-semibold">
                JAIN
              </span>
            )}
            {isGF && (
              <span className="text-[9px] bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 px-1.5 py-0.5 rounded-xs font-semibold">
                GLUTEN-FREE
              </span>
            )}
            {dish.spiceLevel === 'SPICY' && (
              <span className="text-[9px] text-primary font-bold flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5" /> Hot
              </span>
            )}
          </div>
        </div>

        {/* Bottom Actions: View Item & Inline Cart Buttons */}
        <div className="pt-2 border-t border-border flex items-center gap-2">
          <Link
            href={`/products/${dish.slug}`}
            className="flex-1 py-1.5 text-center text-xs font-semibold text-foreground bg-surface-muted hover:bg-surface-subtle rounded-xl border border-border transition-colors min-h-[36px] flex items-center justify-center"
          >
            View item
          </Link>

          {currentQty > 0 ? (
            <div className="flex items-center gap-1 bg-foreground text-background rounded-xl p-0.5 shadow-xs shrink-0 min-h-[36px]">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:text-primary active:scale-95 transition-all cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold w-5 text-center select-none">{currentQty}</span>
              <button
                onClick={handleIncrement}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:text-primary active:scale-95 transition-all cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="min-h-[36px] px-3.5 py-1.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary-hover active:scale-[0.98] rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
              aria-label={`Add ${dish.name} to cart`}
            >
              {isAdding ? '...' : '+ Add'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
