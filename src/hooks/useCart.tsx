"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/types';

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  [tenantSlug: string]: {
    items: CartItem[];
  };
}

interface CartContextType {
  cart: CartState;
  addItem: (product: Product, tenantSlug: string) => void;
  removeItem: (productId: string, tenantSlug: string) => void;
  updateQuantity: (productId: string, tenantSlug: string, quantity: number) => void;
  clearTenantCart: (tenantSlug: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTenantTotal: (tenantSlug: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({});

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('tibeb_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('tibeb_cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (product: Product, tenantSlug: string) => {
    setCart((prev) => {
      const tenantCart = prev[tenantSlug] || { items: [] };
      const existingItem = tenantCart.items.find((item) => item.id === product.id);

      if (existingItem) {
        // Enforce stock limit: if stock is a number, cap at that value
        const maxQty = (product.stock === null || product.stock === undefined) ? Infinity : product.stock;
        const newQty = Math.min(existingItem.quantity + 1, maxQty);
        return {
          ...prev,
          [tenantSlug]: {
            ...tenantCart,
            items: tenantCart.items.map((item) =>
              item.id === product.id ? { ...item, quantity: newQty } : item
            ),
          },
        };
      }

      // Don't allow adding out-of-stock items
      if (product.stock === 0) return prev; // stock=0 means out of stock; undefined/null means unlimited

      return {
        ...prev,
        [tenantSlug]: {
          ...tenantCart,
          items: [
            ...tenantCart.items,
            { ...product, quantity: 1, tenantId: String((product as any).tenantId ?? tenantSlug) },
          ],
        },
      };
    });
  };
//Removing an item
  const removeItem = (productId: string, tenantSlug: string) => {
    setCart((prev) => {
      const tenantCart = prev[tenantSlug];
      if (!tenantCart) return prev;

      const newItems = tenantCart.items.filter((item) => item.id !== productId);
      
      if (newItems.length === 0) {
        const { [tenantSlug]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [tenantSlug]: {
          ...tenantCart,
          items: newItems,
        },
      };
    });
  };
//Updating quantity
  const updateQuantity = (productId: string, tenantSlug: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, tenantSlug);
      return;
    }

    setCart((prev) => {
      const tenantCart = prev[tenantSlug];
      if (!tenantCart) return prev;

      return {
        ...prev,
        [tenantSlug]: {
          ...tenantCart,
          items: tenantCart.items.map((item) => {
            if (item.id !== productId) return item;
            // Enforce stock limit
            const maxQty = (item.stock === null || item.stock === undefined) ? Infinity : item.stock;
            return { ...item, quantity: Math.min(quantity, maxQty) };
          }),
        },
      };
    });
  };

  const clearTenantCart = (tenantSlug: string) => {
    setCart((prev) => {
      const { [tenantSlug]: _, ...rest } = prev;
      return rest;
    });
  };

  const clearCart = () => setCart({});

  const getItemCount = () => {
    return Object.values(cart).reduce(
      (total, tenantCart) => total + tenantCart.items.reduce((sum, item) => sum + item.quantity, 0),
      0
    );
  };

  const getTenantTotal = (tenantSlug: string) => {
    const tenantCart = cart[tenantSlug];
    if (!tenantCart) return 0;
    return tenantCart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearTenantCart,
        clearCart,
        getItemCount,
        getTenantTotal,
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
