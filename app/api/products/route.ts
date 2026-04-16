import { auth } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { Product } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/schema';

import { NextRequest, NextResponse } from 'next/server';
import slugify from 'slugify';
import Fuse from 'fuse.js';

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
  req: NextRequest,
): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access.' },
        { status: 401 },
      );
    }

    // Validate Product
    const body = await req.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid product data.' },
        { status: 400 },
      );
    }

    const data = result.data;
    const slug = slugify(data.title, { lower: true, strict: true });

    // Parse tags from comma-separated string
    const tags = data.tags
      ? data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Upload Image to Cloudinary
    const uploaded = await cloudinary.uploader.upload(data.image, {
      folder: 'heal-point',
    });

    // Save Product to Database
    const product = await prisma.product.create({
      data: {
        title: data.title,
        brand: data.brand,
        price: data.price,
        image: uploaded.secure_url,
        medicineType: data.medicineType,
        medicineQuantity: data.medicineQuantity,
        description: data.description,
        stock: data.stock,
        tags,
        isActive: data.isActive,
        slug,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('[PRODUCT_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * @route GET /api/products
 * @desc Get all products or search with Fuse.js
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse<Product[]>>> {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    // Only get active products for public API
    let products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // If search query provided, use Fuse.js for fuzzy search
    if (q && q.trim()) {
      const fuseOptions = {
        keys: ['title', 'brand', 'medicineType', 'tags'],
        threshold: 0.4,
        includeScore: true,
      };

      const fuse = new Fuse(products, fuseOptions);
      const searchResults = fuse.search(q.trim());

      // Return top 8 results
      products = searchResults.slice(0, 8).map((result) => result.item);
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('[PRODUCT_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
