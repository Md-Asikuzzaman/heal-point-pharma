import { Metadata } from "next";
import { redirect } from "next/navigation";
import ProjectDetailsCard from "../_components/ProjectDetailsCard";
import { prisma } from "@/lib/prisma";
import { Product } from "@/lib/generated/prisma";

export const revalidate = 60;
interface Props {
  params: Promise<{ slug: string }>;
}

type ProductApiResponse = {
  success: boolean;
  data: Product;
};

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: { slug: true },
    take: 10,
  });

  return products.map((product) => ({
    slug: product.slug,
  }));
}

// generateMetadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/${slug}`,
    {
      next: { revalidate: 60 },
    }
  );

  const { data: product }: ProductApiResponse = await res.json();

  if (!product) {
    return {
      title: "Product not found",
      description: "Product not found",
    };
  }

  return {
    title: `${product.title}`,
    description: `Buy ${product.title} at only ৳${product.price}. 100% organic and authentic natural products.`,
    openGraph: {
      title: `${product.title}`,
      description: `Buy ${product.title} at only ৳${product.price}. 100% organic and authentic natural products.`,
      images: [
        {
          url: product.image,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/products/${slug}`,
    {
      next: { revalidate: 60 },
    }
  );

  const product: ProductApiResponse = await res.json();

  if (!product.success) {
    redirect("/products");
  }

  return (
    <>
      <ProjectDetailsCard {...product.data} />
    </>
  );
}
