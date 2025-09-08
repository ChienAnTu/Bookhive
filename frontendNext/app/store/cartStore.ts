// app/store/cartStore.ts
import { create } from "zustand";
import type { Book } from "@/app/types/book";

export type CartItem = Book & {
  mode: "borrow" | "purchase";
};

interface CartState {
  cart: CartItem[];
  // Can pass preferred mode; returns whether successful
  addToCart: (book: Book, preferredMode?: "borrow" | "purchase") => boolean;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setMode: (id: string, mode: "borrow" | "purchase") => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (book, preferredMode) => {
    const { cart } = get();
    if (cart.find((b) => b.id === book.id)) return true; // Already in cart, consider as successful

    // Calculate final mode (prefer preferredMode, then auto-select based on capability)
    let finalMode: "borrow" | "purchase" | null = null;

    if (preferredMode === "borrow" && book.canRent) finalMode = "borrow";
    else if (preferredMode === "purchase" && book.canSell) finalMode = "purchase";
    else if (preferredMode == null) {
      // Auto-select if not specified: prefer rent
      if (book.canRent) finalMode = "borrow";
      else if (book.canSell) finalMode = "purchase";
    }

    if (!finalMode) return false; // Neither supported → failure

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
