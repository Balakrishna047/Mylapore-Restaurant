'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function MobileCartBar() {
  const { cart, itemCount, openCart, isOpen } = useCart();

  if (isOpen || !itemCount || itemCount === 0) {
    return null;
  }

  const subtotal = cart?.subtotal || 0;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden animate-in slide-in-from-bottom duration-300 pointer-events-auto">
      <div className="bg-surface/95 dark:bg-surface border-t border-border shadow-2xl px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-md">
        {/* Left: Summary */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-foreground tracking-wide">
              {itemCount} {itemCount === 1 ? 'dish' : 'dishes'} in cart
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Subtotal: <strong className="text-foreground">${subtotal.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Right: View Cart Button */}
        <button
          onClick={openCart}
          className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary-hover active:scale-[0.98] text-primary-foreground text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
