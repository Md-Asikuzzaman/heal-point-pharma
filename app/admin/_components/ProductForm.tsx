'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import RichTextEditor from '@/components/shared/rich-text-editor';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { convertToBase64 } from '@/utils';
import Image from 'next/image';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import SubmitButton from '@/app/auth/_components/SubmitButton';
import type { Product } from '@/lib/generated/prisma';
import { productFormSchema } from '@/schema';
import { Checkbox } from '@/components/ui/checkbox';

type ProductSchema = z.infer<typeof productFormSchema>;

interface Props {
  product?: Product;
}

const ProductForm = ({ product }: Props) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ProductSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: product?.title ?? '',
      brand: product?.brand ?? '',
      price: product?.price ?? 0,
      image: product?.image ?? '',
      medicineType: product?.medicineType ?? '',
      medicineQuantity: product?.medicineQuantity ?? '',
      description: product?.description ?? '',
      stock: product?.stock ?? 0,
      tags: product?.tags?.join(', ') ?? '',
      isActive: product?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (product) setPreviewImage(product.image);
  }, [product]);

  const onSubmit = (data: ProductSchema) => {
    if (product) {
      updateOrder(data);
    } else {
      addOrder(data);
    }
  };

  // Add Order Mutation
  const { mutate: addOrder, isPending: addOrderPending } = useMutation({
    mutationKey: ['add-order'],
    mutationFn: async (data: ProductSchema) => {
      const res = await axios.post(`/api/products`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Product added successfully!');
      form.reset();
      setPreviewImage(null);
      queryClient.invalidateQueries({ queryKey: ['get-orders'] });
    },
  });

  // Update Order Mutation
  const { mutate: updateOrder, isPending: updateOrderPending } = useMutation({
    mutationKey: ['update-order'],
    mutationFn: async (data: ProductSchema) => {
      const res = await axios.patch(`/api/products/${product?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Product updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['get-orders'] });
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await convertToBase64(file);
      form.setValue('image', base64, { shouldValidate: true });
      setPreviewImage(base64);
    } catch {
      toast.error('Failed to convert image');
    }
  };

  return (
    <div className='w-full p-6 border rounded-xl shadow-sm bg-white'>
      <h2 className='text-xl font-semibold mb-4'>
        {product ? 'Update Product' : 'Add Product'}
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Title */}
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder='Enter product title' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description (Rich Text Editor with ShadCN form controls) */}
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Controller
                name='description'
                control={form.control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormControl>
            <FormMessage>
              {form.formState.errors.description?.message}
            </FormMessage>
          </FormItem>

          {/* Brand */}
          <FormField
            control={form.control}
            name='brand'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder='Enter brand name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (৳)</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='Enter price' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload */}
          <FormField
            control={form.control}
            name='image'
            render={() => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <FormControl>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                  />
                </FormControl>
                {previewImage && (
                  <div className='mt-2'>
                    <Image
                      src={previewImage}
                      alt='Preview'
                      width={200}
                      height={200}
                      className='rounded border'
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Medicine Type */}
          <FormField
            control={form.control}
            name='medicineType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medicine Type</FormLabel>
                <FormControl>
                  <Input placeholder='e.g. Tablet, Capsule, Syrup' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Medicine Quantity */}
          <FormField
            control={form.control}
            name='medicineQuantity'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medicine Quantity</FormLabel>
                <FormControl>
                  <Input placeholder='e.g. 500 ml, 10 pieces' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock Management - Two columns */}
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='stock'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min='0'
                      placeholder='Enter stock quantity'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. pain relief, fever, headache'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Active Status */}
          <FormField
            control={form.control}
            name='isActive'
            render={({ field }) => (
              <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className='space-y-1 leading-none'>
                  <FormLabel>Active Product</FormLabel>
                  <p className='text-sm text-muted-foreground'>
                    Make this product visible on the store
                  </p>
                </div>
              </FormItem>
            )}
          />

          <SubmitButton
            text={product ? 'Update Product' : 'Add Product'}
            loadingText={product ? 'Product Updating...' : 'Product Adding...'}
            isPending={addOrderPending || updateOrderPending}
          />
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;
