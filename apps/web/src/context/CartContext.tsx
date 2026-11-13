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
  addItem: (item: {
    menuItemId: string;
    quantity: number;
    variantId?: string;
    spiceLevel?: string;
    specialInstructions?: string;
    name?: string;
    image?: string;
    price?: number;
    variantName?: string;
  }) => Promise<void>;
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

  const addItem = async (itemData: {
    menuItemId: string;
    quantity: number;
    variantId?: string;
    spiceLevel?: string;
    specialInstructions?: string;
    name?: string;
    image?: string;
    price?: number;
    variantName?: string;
  }) => {
    // 1. Instantly open drawer with 0ms lag
    setIsOpen(true);

    // 2. Snapshot current cart for rollback if needed
    const prevCart = cart || { items: [], subtotal: 0, itemCount: 0 };
    const currentItems = [...(prevCart.items || [])];

    // 3. Compute Optimistic Cart State immediately
    const unitPrice = itemData.price !== undefined ? itemData.price : 12.99;
    const qtyToAdd = itemData.quantity || 1;

    const existingIndex = currentItems.findIndex(
      (i: any) =>
        i.menuItemId === itemData.menuItemId &&
        (itemData.variantId ? i.variantId === itemData.variantId : true) &&
        (itemData.spiceLevel ? i.spiceLevel === itemData.spiceLevel : true)
    );

    let nextItems: any[];
    if (existingIndex > -1) {
      const existing = currentItems[existingIndex];
      const newQty = existing.quantity + qtyToAdd;
      nextItems = [...currentItems];
      nextItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: Number((newQty * existing.unitPrice).toFixed(2)),
      };
    } else {
      nextItems = [
        ...currentItems,
        {
          id: 'opt_' + Math.random().toString(36).substring(2, 9),
          menuItemId: itemData.menuItemId,
          name: itemData.name || 'Authentic Dish',
          image: itemData.image || '',
          quantity: qtyToAdd,
          unitPrice: unitPrice,
          totalPrice: Number((qtyToAdd * unitPrice).toFixed(2)),
          variantId: itemData.variantId,
          variantName: itemData.variantName,
          spiceLevel: itemData.spiceLevel || 'MEDIUM',
          isBlastChilled: true,
        },
      ];
    }

    const optimisticSubtotal = Number(nextItems.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2));
    const optimisticItemCount = nextItems.reduce((acc, item) => acc + item.quantity, 0);

    // Instant local state update (0ms user-perceived delay)
    setCart({
      ...prevCart,
      items: nextItems,
      subtotal: optimisticSubtotal,
      itemCount: optimisticItemCount,
    });

    // 4. Background Server Synchronization
    try {
      const updated = await api.addToCart({
        menuItemId: itemData.menuItemId,
        quantity: itemData.quantity,
        variantId: itemData.variantId,
        spiceLevel: itemData.spiceLevel,
        specialInstructions: itemData.specialInstructions,
      });
      if (updated) setCart(updated);
    } catch (err: any) {
      console.error('Failed to sync item with server:', err);
      setCart(prevCart);
      throw err;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const prevCart = cart || { items: [], subtotal: 0, itemCount: 0 };
    const currentItems = [...(prevCart.items || [])];

    let nextItems: any[];
    if (quantity <= 0) {
      nextItems = currentItems.filter((i: any) => i.id !== itemId);
    } else {
      nextItems = currentItems.map((i: any) => {
        if (i.id === itemId) {
          return {
            ...i,
            quantity,
            totalPrice: Number((quantity * i.unitPrice).toFixed(2)),
          };
        }
        return i;
      });
    }

    const optimisticSubtotal = Number(nextItems.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2));
    const optimisticItemCount = nextItems.reduce((acc, item) => acc + item.quantity, 0);

    // Instant local state update (0ms delay)
    setCart({
      ...prevCart,
      items: nextItems,
      subtotal: optimisticSubtotal,
      itemCount: optimisticItemCount,
    });

    try {
      const updated = await api.updateCartItem(itemId, quantity);
      if (updated) setCart(updated);
    } catch (err: any) {
      console.error('Failed to update quantity on server:', err);
      setCart(prevCart);
    }
  };

  const removeItem = async (itemId: string) => {
    const prevCart = cart || { items: [], subtotal: 0, itemCount: 0 };
    const nextItems = (prevCart.items || []).filter((i: any) => i.id !== itemId);
    const optimisticSubtotal = Number(nextItems.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2));
    const optimisticItemCount = nextItems.reduce((acc, item) => acc + item.quantity, 0);

    // Instant local state update (0ms delay)
    setCart({
      ...prevCart,
      items: nextItems,
      subtotal: optimisticSubtotal,
      itemCount: optimisticItemCount,
    });

    try {
      const updated = await api.removeCartItem(itemId);
      if (updated) setCart(updated);
    } catch (err: any) {
      console.error('Failed to remove item on server:', err);
      setCart(prevCart);
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
