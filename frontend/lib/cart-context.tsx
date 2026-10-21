'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, CartData } from './api';

interface CartContextType {
  cart: CartData | null;
  loading: boolean;
  addToCart: (menuItemId: number, quantity?: number) => Promise<void>;
  updateQuantity: (menuItemId: number, quantity: number) => Promise<void>;
  removeFromCart: (menuItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      const res = await api.getCart();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (menuItemId: number, quantity: number = 1) => {
    setLoading(true);
    try {
      const res = await api.cartAction('add', menuItemId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (menuItemId: number, quantity: number) => {
    setLoading(true);
    try {
      const res = await api.cartAction('update', menuItemId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (menuItemId: number) => {
    setLoading(true);
    try {
      const res = await api.cartAction('remove', menuItemId);
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const res = await api.cartAction('clear');
      if (res.success && res.data) {
        setCart(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
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

