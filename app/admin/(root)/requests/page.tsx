"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Package,
  User,
  MessageSquare,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProductRequest, ProductRequestStatus } from "@/lib/generated/prisma";
import Link from "next/link";

interface ProductRequestWithRelations extends ProductRequest {
  product: {
    title: string;
    slug: string;
    image: string;
    stock: number;
    price: number;
    medicineQuantity: string;
  };
  user: {
    name: string | null;
    email: string | null;
  };
}

const REQUEST_QTY_PATTERN = /^\[RQ:(\d+)\]\s*/;

const getRequestedQuantity = (message?: string | null) => {
  if (!message) return 1;
  const match = message.match(REQUEST_QTY_PATTERN);
  return match ? Number(match[1]) : 1;
};

const getRequestNote = (message?: string | null) => {
  if (!message) return "";
  return message.replace(REQUEST_QTY_PATTERN, "").trim();
};

export default function ProductRequestsPage() {
  const [filter, setFilter] = useState<ProductRequestStatus | "ALL">("ALL");
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["product-requests", filter],
    queryFn: async () => {
      const params = filter !== "ALL" ? `?status=${filter}` : "";
      const res = await axios.get(`/api/product-requests${params}`);
      return res.data.data as ProductRequestWithRelations[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ProductRequestStatus;
    }) => {
      const res = await axios.patch(`/api/product-requests/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Request updated successfully");
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
    },
    onError: () => {
      toast.error("Failed to update request");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/product-requests/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Request deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
    },
    onError: () => {
      toast.error("Failed to delete request");
    },
  });

  const getStatusBadge = (status: ProductRequestStatus) => {
    switch (status) {
      case ProductRequestStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case ProductRequestStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case ProductRequestStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Requests</h1>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          {(
            [
              "ALL",
              ProductRequestStatus.PENDING,
              ProductRequestStatus.APPROVED,
              ProductRequestStatus.REJECTED,
            ] as const
          ).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : !requests?.length ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No product requests found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const requestedQty = getRequestedQuantity(request.message);
            const requestNote = getRequestNote(request.message);

            return (
              <div
                key={request.id}
                className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      {request.product.image ? (
                        <img
                          src={request.product.image}
                          alt={request.product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Request Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <Link
                        href={`/products/${request.product.slug}`}
                        className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {request.product.title}
                      </Link>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.user.name || "Unknown"} ({request.user.email}
                          )
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="font-medium text-green-700">
                          Price: ৳{request.product.price.toFixed(2)}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                          Product Qty:{" "}
                          <span className="font-medium">
                            {request.product.medicineQuantity}
                          </span>
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                          Requested Qty:{" "}
                          <span className="font-medium">{requestedQty}</span>
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                          Current Stock:{" "}
                          <span
                            className={
                              request.product.stock > 0
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {request.product.stock}
                          </span>
                        </span>
                      </div>

                      {requestNote && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            {requestNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {request.status === ProductRequestStatus.PENDING && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50"
                          disabled={
                            updateMutation.isPending || deleteMutation.isPending
                          }
                          onClick={() =>
                            updateMutation.mutate({
                              id: request.id,
                              status: ProductRequestStatus.APPROVED,
                            })
                          }
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={
                            updateMutation.isPending || deleteMutation.isPending
                          }
                          onClick={() =>
                            updateMutation.mutate({
                              id: request.id,
                              status: ProductRequestStatus.REJECTED,
                            })
                          }
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={
                        deleteMutation.isPending || updateMutation.isPending
                      }
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this request?",
                          )
                        ) {
                          deleteMutation.mutate(request.id);
                        }
                      }}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
