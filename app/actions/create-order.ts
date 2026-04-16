'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createOrderAction(data: {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  items: CartProductType[];
}) {
  try {
    // Validate stock availability for all items
    const stockErrors: string[] = [];

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { id: true, title: true, stock: true, isActive: true },
      });

      if (!product || !product.isActive) {
        stockErrors.push(`${item.title} is no longer available`);
      } else if (product.stock < item.quantity) {
        stockErrors.push(
          `${item.title} has insufficient stock (only ${product.stock} available)`,
        );
      }
    }

    if (stockErrors.length > 0) {
      return {
        success: false,
        message: `Stock issue: ${stockErrors.join(', ')}`,
      };
    }

    // Create order and update stock in a transaction
    const res = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          zipCode: data.zipCode,
          items: {
            create: data.items.map((item) => ({
              productId: item.id,
              title: item.title,
              image: item.image,
              quantity: item.quantity,
              price: item.price,
              brand: item.brand,
              medicineType: item.medicineType,
              medicineQuantity: item.medicineQuantity,
            })),
          },
        },
      });

      // Update stock for each product
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      return order;
    });

    if (!res || !res.id) {
      return {
        success: false,
        message: 'Something went wrong, please try again later.',
      };
    }

    revalidatePath('/admin');

    return {
      success: true,
      message: 'Order placed successfully!',
    };
  } catch (error) {
    console.error('❌ Order create error:', error);

    return {
      success: false,
      message: 'Failed to create order. Please try again.',
    };
  }
}
