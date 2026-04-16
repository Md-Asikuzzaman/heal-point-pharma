import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductRequest, ProductRequestStatus } from "@/lib/generated/prisma";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Params {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  status: z.enum([ProductRequestStatus.APPROVED, ProductRequestStatus.REJECTED]),
});

/**
 * @route PATCH /api/product-requests/{id}
 * @desc Update product request status (admin only)
 */
export async function PATCH(
  req: NextRequest,
  ctx: Params
): Promise<NextResponse<ApiResponse<ProductRequest>>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { id: requestId } = await ctx.params;
    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be APPROVED or REJECTED." },
        { status: 400 }
      );
    }

    const { status } = result.data;

    // Check if request exists
    const existingRequest = await prisma.productRequest.findUnique({
      where: { id: requestId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Product request not found." },
        { status: 404 }
      );
    }

    if (existingRequest.status !== ProductRequestStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: "Request has already been processed." },
        { status: 400 }
      );
    }

    // Update request status
    const updated = await prisma.productRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        product: {
          select: { title: true, slug: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("[PRODUCT_REQUEST_PATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
