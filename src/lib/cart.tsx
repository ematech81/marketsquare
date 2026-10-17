"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import { useHydrated } from "./hydrated";

export type CartLine = {
  id: string;
  product: { id: string; title: string; slug: string; image: string | null; seller: { id: string | null; name: string }; ageRestricted?: boolean };
  price: number;
  quantity: number;
  options: { name: string; value: string }[];
  stock: number;
  issue: string | null;
  lineTotal: number;
};

export type CartData = { items: CartLine[]; subtotal: number; itemCount: number };

type CartState = {
  cart: CartData;
  add: (productId: string, quantity: number, options: { name: string; value: string }[]) => Promise<void>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const empty: CartData = { items: [], subtotal: 0, itemCount: 0 };
const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartData>(empty);

  const refresh = useCallback(async () => {
    if (!token) {
      setCart(empty);
      return;
    }
    try {
      setCart(await api<CartData>("/cart", { token }));
    } catch {
      setCart(empty);
    }
  }, [token]);

  useEffect(() => {
    // Deferred one tick so the fetch result is never set during the effect itself.
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const value: CartState = {
    cart,
    refresh,
    add: async (productId, quantity, options) =>
      setCart(await api<CartData>("/cart/items", { method: "POST", token, body: { productId, quantity, options } })),
    setQuantity: async (itemId, quantity) =>
      setCart(await api<CartData>(`/cart/items/${itemId}`, { method: "PATCH", token, body: { quantity } })),
    remove: async (itemId) => setCart(await api<CartData>(`/cart/items/${itemId}`, { method: "DELETE", token })),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  const hydrated = useHydrated();
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  // See useAuth: the first thing drawn matches the server's page, then the real cart appears.
  return hydrated ? ctx : { ...ctx, cart: empty };
}
