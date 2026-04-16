'use client';

import { useCartStore } from '@/store/useCartStore';
import Image from 'next/image';
import Link from 'next/link';
import { FaStar } from 'react-icons/fa6';
import { Card, CardContent, CardFooter } from '../ui/card';
import { useRouter } from 'next/navigation';
import slugify from 'slugify';
import { Minus, Plus, Trash2, PackageX, Bell } from 'lucide-react';
import type { Product } from '@/lib/generated/prisma';
import { useState } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const ProductRequestModal = dynamic(
  () => import('@/components/shared/ProductRequestModal'),
  { ssr: false },
);

export const ProductCard = ({ ...product }: Product) => {
  const router = useRouter();
  const { title, price, image, rating, stock, id } = product;
  const {
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCartStore();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const inCart = cart.find((p) => p.id === product.id);
  const slug = slugify(title, { lower: true, strict: true });
  const inStock = stock > 0;
  const lowStock = stock > 0 && stock < 10;

  const handleAddToCart = () => {
    if (!inStock) {
      toast.error('This product is currently out of stock');
      return;
    }
    addToCart({
      ...product,
      quantity: 1,
    });
    toast.success('Added to cart!');
  };

  const handleOrder = () => {
    if (!inStock) {
      toast.error('This product is currently out of stock');
      return;
    }
    if (inCart) {
      router.push('/checkout');
    } else {
      addToCart({
        ...product,
        quantity: 1,
      });
      router.push('/checkout');
    }
  };

  const handleRequestProduct = () => {
    setShowRequestModal(true);
  };

  return (
    <>
      <Card
        className={`group relative w-full lg:max-w-xs rounded-xl border hover:shadow-lg transition-all duration-300 ${!inStock ? 'opacity-90' : ''}`}
      >
        {/* Stock Badge */}
        <div className='absolute top-3 left-3 z-10'>
          {inStock ? (
            lowStock ? (
              <span className='inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full'>
                <PackageX className='w-3 h-3' />
                {stock} left
              </span>
            ) : (
              <span className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full'>
                <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                In Stock
              </span>
            )
          ) : (
            <span className='inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full'>
              <PackageX className='w-3 h-3' />
              Out of Stock
            </span>
          )}
        </div>

        {/* Image */}
        <Link href={`/products/${slug}`}>
          <div className='relative w-full aspect-[4/3] overflow-hidden rounded-t-xl'>
            <Image
              title={title}
              src={image}
              alt={title}
              fill
              sizes='(max-width: 640px) 100vw, 33vw'
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!inStock ? 'grayscale-[30%]' : ''}`}
            />
          </div>
        </Link>
        {/* Content */}
        <CardContent className='p-4'>
          <h3 className='text-md font-semibold text-gray-800 group-hover:text-green-600 line-clamp-2 mb-1'>
            {title}
          </h3>

          <div className='flex items-center justify-between mb-2'>
            <p
              className='text-green-600 font-bold text-lg'
              aria-label='product price'
            >
              ৳{price.toFixed(2)}
            </p>
            <div className='flex items-center gap-0.5 text-yellow-500 text-sm'>
              {Array.from({ length: rating ?? 5 }).map((_, i) => (
                <FaStar key={i} aria-label='star' />
              ))}
            </div>
          </div>
        </CardContent>
        {/* Footer */}
        <CardFooter className='p-4 pt-0 flex flex-col gap-2'>
          {/* Add to Cart or Request Product */}
          {!inStock ? (
            <button
              onClick={handleRequestProduct}
              className='w-full py-2 px-4 text-sm font-medium bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors flex items-center justify-center gap-2'
            >
              <Bell className='w-4 h-4' />
              Request Product
            </button>
          ) : !inCart ? (
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className='w-full py-2 px-4 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
            >
              Add to Cart
            </button>
          ) : (
            <div className='flex items-center gap-3'>
              <div className='flex items-center border rounded-full p-1.5 gap-3 bg-white shadow-sm'>
                <button
                  aria-label='decrease quantity'
                  onClick={() => decreaseQuantity(product.id)}
                  className='bg-red-500 hover:bg-red-600 text-white p-1 rounded-full text-sm font-bold'
                >
                  <Minus size={18} />
                </button>
                <span className='text-base font-medium text-gray-800'>
                  {inCart.quantity}
                </span>
                <button
                  aria-label='increase quantity'
                  disabled={inCart.quantity >= 10}
                  onClick={() => increaseQuantity(product.id)}
                  className='bg-green-500 hover:bg-green-600 text-white p-1 rounded-full text-sm font-bold'
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* 🗑️ Delete Button */}
              <button
                onClick={() => removeFromCart(product.id)}
                title='Remove from cart'
                className='bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-full p-1.5 shadow-sm transition-all duration-200 border border-red-200 hover:shadow-md'
              >
                <Trash2 className='w-4.5 h-4.5' />
              </button>
            </div>
          )}

          {/* Order Now or Out of Stock */}
          {inStock ? (
            <button
              onClick={handleOrder}
              className='w-full py-2 px-4 text-sm font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors'
            >
              Order Now
            </button>
          ) : (
            <button
              disabled
              className='w-full py-2 px-4 text-sm font-medium bg-gray-300 text-gray-500 rounded-md cursor-not-allowed'
            >
              Out of Stock
            </button>
          )}
        </CardFooter>
      </Card>

      {/* Product Request Modal */}
      <ProductRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        product={product}
      />
    </>
  );
};
