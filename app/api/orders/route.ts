import { Order } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * @route GET /api/orders
 * @desc Get all orders
 */
export async function GET(): Promise<NextResponse<ApiResponse<Order[]>>> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    console.error("[ORDERS_GET_ERROR]", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
