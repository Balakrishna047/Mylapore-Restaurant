'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, Snowflake, MapPin } from 'lucide-react';

export default function CartDrawer() {
  const { cart, isOpen, closeCart, updateQuantity, removeItem } = useCart();
  const { location, openModal: openLocationModal } = useLocation();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const isFreeDelivery = subtotal >= 45.00;
  const deliveryFee = isFreeDelivery ? 0 : 4.99;
  const discount = appliedCoupon === 'MYLAPORE15' ? Number((subtotal * 0.15).toFixed(2)) : (appliedCoupon === 'WELCOME5' ? 5.00 : 0);
  const tax = Number((Math.max(0, subtotal - discount) * 0.0825).toFixed(2));
  const total = Number((Math.max(0, subtotal - discount) + tax + deliveryFee).toFixed(2));

  const remainingForFree = Math.max(0, 45.00 - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / 45.00) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.toUpperCase().trim();
    if (code === 'MYLAPORE15' || code === 'WELCOME5') {
      setAppliedCoupon(code);
      setCouponCode('');
    } else {
      alert('Invalid coupon code. Try MYLAPORE15 or WELCOME5');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E7DFD5] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-[#E7DFD5] bg-[#FAF4E8]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg text-[#1C1917]">Your Cart</h2>
                <span className="bg-[#D95338] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart?.itemCount || 0}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Location Preview */}
            <div className="flex items-center justify-between text-xs bg-white/80 p-2.5 rounded-xl border border-[#E7DFD5]">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#D95338] shrink-0" />
                <span className="text-[11px] text-[#44403C] truncate font-medium">
                  {location.city}, {location.state} ({location.zipCode})
                </span>
              </div>
              <button
                onClick={() => {
                  closeCart();
                  openLocationModal();
                }}
                className="text-[11px] font-bold text-[#C8851A] hover:underline shrink-0 ml-2"
              >
                Change
              </button>
            </div>

            {/* Visual Free Delivery Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#1C1917]">
                  {isFreeDelivery
                    ? '🎉 You unlocked FREE Blast-Chilled Delivery!'
                    : `Add $${remainingForFree.toFixed(2)} more for FREE Delivery`}
                </span>
                <span className="font-bold text-[#C8851A]">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#E7DFD5] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#C8851A] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <span className="text-4xl mb-3">🥘</span>
                <p className="font-serif font-bold text-base text-[#1C1917] mb-1">Your cart is empty</p>
                <p className="text-xs text-[#78716C] max-w-xs mb-6">
                  Explore authentic freshly cooked and blast-chilled South Indian favorites from our menu.
                </p>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 bg-[#D95338] text-white text-xs font-bold rounded-full hover:bg-[#C84B31] shadow-xs"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-3 pb-4 border-b border-[#E7DFD5] last:border-b-0 items-start"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF4E8] shrink-0 border border-[#E7DFD5]">
                    <img
                      src={item.image || '/images/dishes/potato-kara-kari.webp'}
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/dishes/potato-kara-kari.webp';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-xs text-[#1C1917] truncate">
                      {item.name}
                    </h4>
                    {item.optionsSummary && (
                      <p className="text-[10px] text-[#78716C] truncate mt-0.5">
                        {item.optionsSummary}
                      </p>
                    )}
                    <span className="text-xs font-bold text-[#D95338] block mt-1">
                      ${Number(item.totalPrice).toFixed(2)}
                    </span>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-[#E7DFD5] rounded-lg px-2 py-0.5 bg-[#FAF4E8]">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="text-[#78716C] hover:text-[#1C1917]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#1C1917] w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-[#78716C] hover:text-[#1C1917]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#78716C] hover:text-[#D95338] transition-colors p-1"
                        title="Remove dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {items.length > 0 && (
            <div className="border-t border-[#E7DFD5] p-5 bg-[#FAF4E8]/90 space-y-3">
              {/* Freshness Callout */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px]">
                <Snowflake className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Blast-chilled at 38°F with insulated cooling totes</span>
              </div>

              {/* Coupon input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (MYLAPORE15)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs uppercase bg-white border border-[#E7DFD5] rounded-xl focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1C1917] text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="text-xs text-emerald-700 flex items-center justify-between font-medium">
                  <span>Coupon {appliedCoupon} applied</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-1 text-xs text-[#78716C] border-t border-[#E7DFD5] pt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{isFreeDelivery ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-sm text-[#1C1917] pt-1 border-t border-[#E7DFD5]">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3 bg-[#D95338] hover:bg-[#C84B31] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
