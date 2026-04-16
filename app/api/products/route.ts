import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { Product } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/schema";

import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * @route POST /api/products
 * @desc Create a new product
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    // Validate Product
    const body = await req.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid product data." },
        { status: 400 }
      );
    }

    const data = result.data;
    const slug = slugify(data.title, { lower: true, strict: true });

    // Upload Image to Cloudinary
    const uploaded = await cloudinary.uploader.upload(data.image, {
      folder: "heal-point",
    });

    // Save Product to Database
    const product = await prisma.product.create({
      data: {
        ...data,
        image: uploaded.secure_url,
        slug,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("[PRODUCT_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * @route GET /api/products
 * @desc Get all products
 */
export async function GET(): Promise<NextResponse<ApiResponse<Product[]>>> {
  try {
    const products = await prisma.product.findMany();

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("[PRODUCT_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
