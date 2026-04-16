import type { Product } from "@/lib/generated/prisma";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProductStoreType = Product & {
  quantity: number;
};

type CartStore = {
  cart: ProductStoreType[];
  addToCart: (product: ProductStoreType) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (product) => {
        const cart = get().cart;
        const exist = cart.find((item) => item.id === product.id);

        if (exist) {
          set({
            cart: cart.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    quantity:
                      item.quantity + product.quantity > 10
                        ? 10
                        : item.quantity + product.quantity,
                  }
                : item,
            ),
          });
        } else {
          const qty = product.quantity > 10 ? 10 : product.quantity;
          set({ cart: [...cart, { ...product, quantity: qty }] });
        }
      },

      removeFromCart: (id) => {
        set({
          cart: get().cart.filter((item) => item.id !== id),
        });
      },

      increaseQuantity: (id) => {
        set({
          cart: get().cart.map((item) => {
            if (item.id === id) {
              const newQuantity = item.quantity + 1;
              return {
                ...item,
                quantity: newQuantity > 10 ? 10 : newQuantity,
              };
            }
            return item;
          }),
        });
      },

      decreaseQuantity: (id) => {
        const cart = get().cart;
        const item = cart.find((item) => item.id === id);

        if (!item) return;

        if (item.quantity === 1) {
          set({ cart: cart.filter((item) => item.id !== id) });
        } else {
          set({
            cart: cart.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
            ),
          });
        }
      },

      clearCart: () => {
        set({ cart: [] });
      },

      getTotalItems: () => {
        return get().cart.reduce((acc, item) => acc + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().cart.reduce(
          (acc, item) => acc + item.quantity * item.price,
          0,
        );
      },
    }),
    {
      name: "cart-storage", // key for localStorage
    },
  ),
);
