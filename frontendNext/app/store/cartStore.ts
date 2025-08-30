// app/store/cartStore.ts
import { create } from "zustand";
import type { Book } from "@/app/types/book";

export type CartItem = Book & {
  mode: "borrow" | "purchase";
};

interface CartState {
  cart: CartItem[];
  // 可传入首选模式；返回是否成功
  addToCart: (book: Book, preferredMode?: "borrow" | "purchase") => boolean;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setMode: (id: string, mode: "borrow" | "purchase") => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (book, preferredMode) => {
    const { cart } = get();
    if (cart.find((b) => b.id === book.id)) return true; // 已在购物车，视为成功

    // 计算最终 mode（优先用 preferredMode，其次按能力自动选）
    let finalMode: "borrow" | "purchase" | null = null;

    if (preferredMode === "borrow" && book.canRent) finalMode = "borrow";
    else if (preferredMode === "purchase" && book.canSell) finalMode = "purchase";
    else if (preferredMode == null) {
      // 未指定则自动选择：能租优先
      if (book.canRent) finalMode = "borrow";
      else if (book.canSell) finalMode = "purchase";
    }

    if (!finalMode) return false; // 两者都不支持 → 失败

    set({ cart: [...cart, { ...book, mode: finalMode }] });
    return true;
  },

  removeFromCart: (id) =>
    set((state) => ({ cart: state.cart.filter((b) => b.id !== id) })),

  clearCart: () => set({ cart: [] }),

  setMode: (id, mode) =>
    set((state) => ({
      cart: state.cart.map((b) => (b.id === id ? { ...b, mode } : b)),
    })),
}));
