import type { Product } from '@/lib/generated/prisma';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProductStoreType = Product & {
  quantity: number;
};

type CartStore = {
  cart: ProductStoreType[];
  addToCart: (product: ProductStoreType) => boolean;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string, stockLimit?: number) => boolean;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  validateCartStock: (products: Product[]) => {
    valid: boolean;
    invalidItems: string[];
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (product) => {
        const cart = get().cart;

        // Check if product has stock
        if (product.stock <= 0) {
          return false;
        }

        const exist = cart.find((item) => item.id === product.id);

        if (exist) {
          // Check if we can add more (respecting stock limit)
          const maxQty = Math.min(10, product.stock);
          const newQty = Math.min(exist.quantity + product.quantity, maxQty);

          set({
            cart: cart.map((item) =>
              item.id === product.id ? { ...item, quantity: newQty } : item,
            ),
          });
        } else {
          const qty = Math.min(
            Math.max(1, product.quantity),
            Math.min(10, product.stock),
          );
          set({ cart: [...cart, { ...product, quantity: qty }] });
        }
        return true;
      },

      removeFromCart: (id) => {
        set({
          cart: get().cart.filter((item) => item.id !== id),
        });
      },

      increaseQuantity: (id, stockLimit) => {
        const cart = get().cart;
        const item = cart.find((item) => item.id === id);

        if (!item) return false;

        // Check stock limit
        const effectiveStockLimit = stockLimit ?? item.stock;
        const maxAllowed = Math.min(10, effectiveStockLimit);

        if (item.quantity >= maxAllowed) {
          return false;
        }

        set({
          cart: cart.map((item) => {
            if (item.id === id) {
              return { ...item, quantity: item.quantity + 1 };
            }
            return item;
          }),
        });
        return true;
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

      validateCartStock: (products) => {
        const cart = get().cart;
        const invalidItems: string[] = [];

        for (const cartItem of cart) {
          const product = products.find((p) => p.id === cartItem.id);
          if (!product || product.stock < cartItem.quantity) {
            invalidItems.push(cartItem.title);
          }
        }

        return { valid: invalidItems.length === 0, invalidItems };
      },
    }),
    {
      name: 'cart-storage', // key for localStorage
    },
  ),
);
