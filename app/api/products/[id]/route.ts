import { auth } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { Product } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { productSchema } from '@/schema';
import { getPublicIdFromUrl } from '@/utils/cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import slugify from 'slugify';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * @route DELETE /api/products/{id}
 * @desc Delete a product
 */
export async function DELETE(
  req: NextRequest,
  ctx: Params,
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access.' },
        { status: 401 },
      );
    }

    // Validate product ID
    const { id: productId } = await ctx.params;
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required.' },
        { status: 400 },
      );
    }

    // Find the product
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 },
      );
    }

    // Delete image from Cloudinary
    const publicId = getPublicIdFromUrl(existingProduct.image);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete product from DB
    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[PRODUCT_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * @route PATCH /api/products/{id}
 * @desc Update a product
 */
export async function PATCH(
  req: NextRequest,
  ctx: Params,
): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
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
    const { id: productId } = await ctx.params;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Missing product ID.' },
        { status: 400 },
      );
    }

    // Find the product
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 },
      );
    }

    // Prepare new slug & image
    const slug = slugify(data.title, { lower: true, strict: true });
    const oldImagePublicId = getPublicIdFromUrl(existingProduct.image);

    // Upload new image
    const uploaded = await cloudinary.uploader.upload(data.image, {
      folder: 'heal-point',
    });

    // Delete old image
    if (oldImagePublicId) {
      await cloudinary.uploader.destroy(oldImagePublicId);
    }

    // Parse tags from comma-separated string
    const tags = data.tags
      ? data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Update product
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        title: data.title,
        brand: data.brand,
        price: data.price,
        medicineType: data.medicineType,
        medicineQuantity: data.medicineQuantity,
        description: data.description,
        stock: data.stock,
        tags,
        isActive: data.isActive,
        slug,
        image: uploaded.secure_url,
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('[PRODUCT_PATCH_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 },
    );
  }
}

/**
 * @route GET /api/products/{slug}
 * @desc Get a product
 */
export async function GET(
  req: NextRequest,
  ctx: Params,
): Promise<NextResponse<ApiResponse<Product>>> {
  try {
    const { id: slug } = await ctx.params;

    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error) {
    console.error('[PRODUCT_GET_BY_ID_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
