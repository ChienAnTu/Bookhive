// app/store/cartStore.ts
import { create } from "zustand";
import { getBookById } from "@/utils/books";
import type { Book } from "@/app/types/book";
import { addItemToCart, removeItemsFromCart, getMyCart } from "@/utils/cart";

export type CartItem = Book & {
  cartItemId: string;  // cart_item primary key
  bookId: string;
  mode: "borrow" | "purchase";
};

interface CartState {
  cart: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (book: Book, preferredMode?: "borrow" | "purchase") => Promise<true | false | "duplicate">;
  removeFromCart: (cartItemIds: string[]) => Promise<void>;
  clearCart: () => void;
  setMode: (id: string, mode: "borrow" | "purchase") => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  loading: false,

  // 拉取后端购物车
  fetchCart: async () => {
    set({ loading: true });
    try {
      const data = await getMyCart();
      if (!data?.items) return;

      // 对每个 cart item 去补全 book 信息
      const items: CartItem[] = await Promise.all(
        data.items.map(async (it: any) => {
          const book = await getBookById(it.bookId); // 拉取书籍详情
          return {
            ...book,
            cartItemId: it.cartItemId,               // 保存后端的 cartItemId
            mode: it.actionType as "borrow" | "purchase",
            salePrice: it.price ?? undefined,
            deposit: it.deposit ?? undefined,
          };
        })
      );

      set({ cart: items });
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      set({ loading: false });
    }
  },

  // 添加到购物车
  addToCart: async (book, preferredMode) => {
    const { cart } = get();

    // ✅ 已存在，返回 "duplicate"
    if (cart.some((b) => b.bookId === book.id)) {
      return "duplicate";
    }

    // 根据书的能力决定最终模式
    let finalMode: "borrow" | "purchase" | null = null;
    if (preferredMode === "borrow" && book.canRent) finalMode = "borrow";
    else if (preferredMode === "purchase" && book.canSell) finalMode = "purchase";
    else if (!preferredMode) {
      if (book.canRent) finalMode = "borrow"; // 默认优先借
      else if (book.canSell) finalMode = "purchase";
    }
    if (!finalMode) return false;

    // 调后端 API
    const res = await addItemToCart({
      bookId: book.id,
      ownerId: book.ownerId,
      actionType: finalMode,
      price: book.salePrice ?? 0,
      deposit: book.deposit ?? 0,
    });

    // 更新本地 store
    set((state) => ({
      cart: [...state.cart, { ...book, bookId: book.id, cartItemId: res.cartItemId, mode: finalMode }],
    }));

    return true;
  },

  removeFromCart: async (cartItemIds) => {
    await removeItemsFromCart(cartItemIds);
    set((state) => ({
      cart: state.cart.filter((b) => !cartItemIds.includes(b.cartItemId)),
    }));
  },

  clearCart: () => set({ cart: [] }),

  setMode: (id, mode) =>
    set((state) => ({
      cart: state.cart.map((b) => (b.id === id ? { ...b, mode } : b)),
    })),
}));
