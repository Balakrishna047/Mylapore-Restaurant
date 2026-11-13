'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, warmUpApi } from '@/lib/api';

interface CartContextType {
  cart: any;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  appliedCoupon: string | null;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  addItem: (item: { menuItemId: string; quantity: number; variantId?: string; spiceLevel?: string; specialInstructions?: string }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any>({ items: [], subtotal: 0, itemCount: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [appliedCoupon, setAppliedCouponState] = useState<string | null>(null);

  const refreshCart = async () => {
    try {
      const data = await api.getCart();
      if (data) setCart(data);
    } catch (err) {
      console.warn('Cart sync pending:', err);
    }
  };

  useEffect(() => {
    warmUpApi();
    refreshCart();

    // Restore persistent coupon if any
    try {
      const savedCoupon = localStorage.getItem('mylapore_coupon');
      if (savedCoupon && ['MYLAPORE15', 'WELCOME5'].includes(savedCoupon)) {
        setAppliedCouponState(savedCoupon);
      }
    } catch {}
  }, []);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const addItem = async (itemData: any) => {
    try {
      const updated = await api.addToCart(itemData);
      setCart(updated);
      setIsOpen(true);
    } catch (err: any) {
      console.error('Failed to add item to cart:', err);
      throw err;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const updated = await api.updateCartItem(itemId, quantity);
      setCart(updated);
    } catch (err: any) {
      console.error('Failed to update quantity:', err);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const updated = await api.removeCartItem(itemId);
      setCart(updated);
    } catch (err: any) {
      console.error('Failed to remove item:', err);
    }
  };

  const applyCoupon = (code: string): boolean => {
    const formatted = code.toUpperCase().trim();
    if (formatted === 'MYLAPORE15' || formatted === 'WELCOME5') {
      setAppliedCouponState(formatted);
      try {
        localStorage.setItem('mylapore_coupon', formatted);
      } catch {}
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setAppliedCouponState(null);
    try {
      localStorage.removeItem('mylapore_coupon');
    } catch {}
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount || 0,
        subtotal: cart?.subtotal || 0,
        isOpen,
        appliedCoupon,
        openCart,
        closeCart,
        refreshCart,
        addItem,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
