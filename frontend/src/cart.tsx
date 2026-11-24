import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from './api';

export type CartItem = { id: number; name: string; price: number; imageUrl: string; qty: number };
type Ctx = {
  items: CartItem[]; count: number; total: number;
  add: (p: Product, qty: number) => void; setQty: (id: number, qty: number) => void;
  remove: (id: number) => void; clear: () => void;
};

const KEY = 'mlc_cart';
const CartCtx = createContext<Ctx>(null!);
export const useCart = () => useContext(CartCtx);
const clamp = (n: number) => Math.max(1, Math.min(99, n));
const load = (): CartItem[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } }, [items]);

  const value = useMemo<Ctx>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => n + i.qty * i.price, 0),
    add: (p, qty) => setItems((cur) => cur.some((i) => i.id === p.id)
      ? cur.map((i) => (i.id === p.id ? { ...i, qty: clamp(i.qty + qty) } : i))
      : [...cur, { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, qty: clamp(qty) }]),
    setQty: (id, qty) => setItems((cur) => cur.map((i) => (i.id === id ? { ...i, qty: clamp(qty) } : i))),
    remove: (id) => setItems((cur) => cur.filter((i) => i.id !== id)),
    clear: () => setItems([]),
  }), [items]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
