'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, warmUpApi } from '@/lib/api';

interface CartContextType {
  cart: any;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  addItem: (item: { menuItemId: string; quantity: number; variantId?: string; spiceLevel?: string; specialInstructions?: string }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any>({ items: [], subtotal: 0, itemCount: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const refreshCart = async () => {
    try {
      const data = await api.getCart();
      if (data) setCart(data);
    } catch (err) {
      console.warn('Cart sync pending:', err);
    }
  };

  useEffect(() => {
    // 1. Immediately warm up free-tier backend in background so cart adds never hit cold start
    warmUpApi();
    // 2. Fetch active session cart
    refreshCart();
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

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount || 0,
        subtotal: cart?.subtotal || 0,
        isOpen,
        openCart,
        closeCart,
        refreshCart,
        addItem,
        updateQuantity,
        removeItem
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
