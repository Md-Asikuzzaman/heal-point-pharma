import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productRequestSchema } from "@/schema";
import { ProductRequest, ProductRequestStatus } from "@/lib/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * @route POST /api/product-requests
 * @desc Create a product request when item is out of stock
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ProductRequest>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = productRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data." },
        { status: 400 }
      );
    }

    const { productId, message } = result.data;

    // Check if product exists and is out of stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    if (product.stock > 0) {
      return NextResponse.json(
        { success: false, error: "Product is already in stock." },
        { status: 400 }
      );
    }

    // Check if user already has a pending request for this product
    const existingRequest = await prisma.productRequest.findFirst({
      where: {
        userId: session.user.id,
        productId,
        status: ProductRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: "You already have a pending request for this product." },
        { status: 400 }
      );
    }

    // Create the product request
    const request = await prisma.productRequest.create({
      data: {
        userId: session.user.id,
        productId,
        message: message || null,
        status: ProductRequestStatus.PENDING,
      },
      include: {
        product: {
          select: { title: true, slug: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: request }, { status: 201 });
  } catch (error) {
    console.error("[PRODUCT_REQUEST_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * @route GET /api/product-requests
 * @desc Get all product requests (admin) or user's requests (user)
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ProductRequest[]>>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ProductRequestStatus | null;

    // If admin, get all requests. Otherwise, get only user's requests
    const whereClause: any = session.user.role === "admin" ? {} : { userId: session.user.id };
    
    if (status) {
      whereClause.status = status;
    }

    const requests = await prisma.productRequest.findMany({
      where: whereClause,
      include: {
        product: {
          select: { title: true, slug: true, image: true, stock: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("[PRODUCT_REQUEST_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
