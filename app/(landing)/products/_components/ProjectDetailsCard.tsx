"use client";

import { CheckCircle, Star } from "lucide-react";
import Image from "next/image";
import ProductActions from "./ProductActions";
import { Product } from "@/lib/generated/prisma";

const ProjectDetailsCard = (product: Product) => {
  const {
    title,
    description,
    image,
    brand,
    rating,
    price,
    medicineType,
    medicineQuantity,
  } = product;

  return (
    <section className="w-full py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-green-100 space-y-5">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left: Image */}
          <div className="relative w-full h-[450px] bg-white rounded-xl overflow-hidden border">
            <Image
              src={image}
              alt={title}
              fill
              className="object-contain p-6"
              priority
            />
            <div className="absolute top-4 left-4 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-green-200 transition-all hover:scale-105">
              <CheckCircle className="w-4 h-4" />
              In Stock
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex flex-col space-y-6">
            <div className="space-y-4">
              {/* Brand */}
              <p className="text-sm text-gray-400">Brand: {brand}</p>

              {/* Title */}
              <h1 className="text-3xl font-bold text-green-700">{title}</h1>

              {/* Type & Quantity Badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                  Type: {medicineType}
                </span>
                <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                  Quantity: {medicineQuantity}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= (rating ?? 5) ? "text-yellow-400" : "text-gray-300"
                    }`}
                    fill={i <= (rating ?? 5) ? "#facc15" : "none"}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">
                  ({rating ?? 5}/5)
                </span>
              </div>

              {/* Guarantee */}
              <div className="mt-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500">
                  Guaranteed quality product
                </span>
              </div>
            </div>

            <p className="text-2xl font-bold text-orange-600">
              ৳{price.toFixed(2)}
            </p>

            {/* Place client component here */}
            <ProductActions {...product} />
          </div>
        </div>

        {/* Description */}
        <p
          className="text-base text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: description }}
        ></p>
      </div>
    </section>
  );
};

export default ProjectDetailsCard;
