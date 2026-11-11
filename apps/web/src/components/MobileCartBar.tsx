'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function MobileCartBar() {
  const { cart, itemCount, openCart, isOpen } = useCart();

  // Do not show on desktop, or when cart drawer is already open, or if cart is empty
  if (isOpen || !itemCount || itemCount === 0) {
    return null;
  }

  const subtotal = cart?.subtotal || 0;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden animate-in slide-in-from-bottom duration-300 pointer-events-auto">
      <div className="bg-[#1C1917] text-white px-4 py-3 border-t border-[#C8851A]/40 shadow-2xl flex items-center justify-between gap-3">
        {/* Left: Summary */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#D95338] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-white tracking-wide">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
            </span>
            <span className="text-[11px] font-semibold text-[#E7DFD5]">
              Subtotal: <strong className="text-white">${subtotal.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Right: View Cart Button */}
        <button
          onClick={openCart}
          className="min-h-[42px] px-4 py-2 bg-[#D95338] hover:bg-[#C84B31] active:bg-[#B33E26] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
