'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { useToast } from '@/context/ToastContext';
import { X, Trash2, Plus, Minus, ArrowRight, Snowflake, MapPin, Tag } from 'lucide-react';

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { location, openModal: openLocationModal } = useLocation();
  const toast = useToast();
  const [couponCode, setCouponCode] = useState('');

  // When cart drawer is open, add class to body to prevent cross-origin widgets from occluding the checkout CTA
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('cart-open');
    } else {
      document.body.classList.remove('cart-open');
    }
    return () => {
      document.body.classList.remove('cart-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const isFreeDelivery = subtotal >= 45.0;
  const deliveryFee = isFreeDelivery ? 0 : 4.99;
  const discount =
    appliedCoupon === 'MYLAPORE15'
      ? Number((subtotal * 0.15).toFixed(2))
      : appliedCoupon === 'WELCOME5'
      ? 5.0
      : 0;
  const tax = Number((Math.max(0, subtotal - discount) * 0.0825).toFixed(2));
  const total = Number((Math.max(0, subtotal - discount) + tax + deliveryFee).toFixed(2));

  const remainingForFree = Math.max(0, 45.0 - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / 45.0) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const ok = applyCoupon(couponCode);
    if (ok) {
      setCouponCode('');
      toast.success('Promo Code Applied', `Discount activated across cart and checkout.`);
    } else {
      toast.error('Invalid Coupon Code', 'Try MYLAPORE15 (15% off) or WELCOME5 ($5 off).');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-label="Close cart overlay"
      />

      {/* Drawer Container */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-full flex z-[99999]">
        <div className="w-full sm:w-[420px] lg:w-[460px] bg-surface border-t sm:border-t-0 sm:border-l border-border rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col justify-between max-h-[92vh] sm:max-h-screen sm:h-screen">
          {/* Mobile Swipe Handle Indicator */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-0.5">
            <div className="w-12 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border bg-surface-muted shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-foreground">
                  Your Cart
                </h2>
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  {cart?.itemCount || 0}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface active:scale-95 transition-all cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Location Preview */}
            <div className="flex items-center justify-between text-xs bg-surface/90 p-2.5 rounded-xl border border-border shadow-2xs">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[11px] text-foreground truncate font-medium">
                  {location.city}, {location.state} ({location.zipCode})
                </span>
              </div>
              <button
                onClick={() => {
                  closeCart();
                  openLocationModal();
                }}
                className="text-[11px] font-bold text-accent hover:underline shrink-0 ml-2 cursor-pointer py-1 px-1.5"
              >
                Change
              </button>
            </div>

            {/* Visual Free Delivery Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">
                  {isFreeDelivery
                    ? '🎉 You unlocked FREE Blast-Chilled Delivery!'
                    : `Add $${remainingForFree.toFixed(2)} more for FREE Delivery`}
                </span>
                <span className="font-bold text-accent">{progressPercent}%</span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <span className="text-4xl mb-3">🥘</span>
                <p className="font-serif font-bold text-base text-foreground mb-1">
                  Your cart is empty
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mb-6">
                  Explore authentic freshly cooked and blast-chilled South Indian favorites from our menu.
                </p>
                <button
                  onClick={closeCart}
                  className="px-6 py-3 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary-hover shadow-xs active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-3 pb-4 border-b border-border last:border-b-0 items-start"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-muted shrink-0 border border-border">
                    <img
                      src={item.image || '/images/placeholder-dish.svg'}
                      alt={item.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-dish.svg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-xs sm:text-sm text-foreground truncate">
                      {item.name}
                    </h4>
                    {item.optionsSummary && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {item.optionsSummary}
                      </p>
                    )}
                    <span className="text-xs font-bold text-primary block mt-1">
                      ${Number(item.totalPrice).toFixed(2)}
                    </span>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Touch-Friendly Quantity Control Pill */}
                      <div className="flex items-center gap-1 border border-border rounded-xl p-0.5 bg-surface-muted">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item.id);
                              toast.info('Item Removed', `${item.name} removed from cart.`);
                            } else {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                          className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-surface border border-border text-foreground hover:text-primary active:scale-95 transition-all shadow-2xs cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-foreground min-w-[24px] text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg bg-surface border border-border text-foreground hover:text-primary active:scale-95 transition-all shadow-2xs cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Touch-Friendly Remove Button */}
                      <button
                        onClick={() => {
                          removeItem(item.id);
                          toast.info('Item Removed', `${item.name} removed from cart.`);
                        }}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all cursor-pointer"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {items.length > 0 && (
            <div className="border-t border-border p-4 sm:p-5 bg-surface-muted space-y-3 shrink-0 pb-6">
              {/* Freshness Callout */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-[11px]">
                <Snowflake className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Blast-chilled at 38°F with insulated cooling totes</span>
              </div>

              {/* Coupon input */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (MYLAPORE15)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs uppercase bg-surface text-foreground border border-border rounded-xl focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all min-h-[38px] cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="text-xs text-success flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Coupon {appliedCoupon} applied
                  </span>
                  <div className="flex items-center gap-2">
                    <span>-${discount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Sales Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{isFreeDelivery ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-sm text-foreground pt-1 border-t border-border">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="pt-1">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all min-h-[46px]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
