"use client";

import { Product } from "@/lib/generated/prisma";
import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductActions(product: Product) {
  const [quantity, setQuantity] = useState(1);
  const { cart, addToCart } = useCartStore();

  const router = useRouter();

  const increase = () => setQuantity((q) => q + 1);
  const decrease = () => setQuantity((q) => (q > 1 ? q - 1 : 1));
  const reset = () => setQuantity(1);

  const inCart = cart.find((p) => p.id === product.id);

  const handleOrder = () => {
    if (inCart) {
      router.push("/checkout");
    } else {
      addToCart({
        ...product,
        quantity: 1,
      });

      router.push("/checkout");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>

        <div className="flex items-center border rounded-full p-1.5 gap-3 bg-white shadow-sm">
          <button
            onClick={decrease}
            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-sm font-bold"
          >
            <Minus size={18} />
          </button>
          <span className="text-base font-medium text-gray-800">
            {quantity}
          </span>
          <button
            onClick={increase}
            className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full text-sm font-bold"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => {
            addToCart({ ...product, quantity });
            reset();
          }}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
        >
          Add to Cart
        </button>
        <button
          onClick={handleOrder}
          className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all"
        >
          Order Now
        </button>
      </div>
    </div>
  );
}
