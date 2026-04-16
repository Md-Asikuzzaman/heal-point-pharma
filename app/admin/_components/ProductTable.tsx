"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/lib/generated/prisma";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ProductApiResponse = {
  success: boolean;
  data: Product[];
};

export default function ProductTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },

    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const src = row.original.image;
        return (
          <Image
            src={src}
            alt={row.original.title}
            height={48}
            width={48}
            className="h-12 w-12 rounded object-cover border"
          />
        );
      },
    },
    {
      accessorKey: "brand",
      header: "Brand",
    },
    {
      accessorKey: "price",
      header: "Price (৳)",
      cell: ({ row }) => <>৳ {row.original.price}</>,
    },
    {
      accessorKey: "medicineType",
      header: "Type",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;

        return (
          <div className="flex gap-2">
            <Button
              disabled={deletingId === product.id}
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/product/${product.id}`)}
            >
              ✏️ Edit
            </Button>

            <Button
              disabled={deletingId === product.id}
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this product?",
                  )
                ) {
                  mutate(product.id);
                }
              }}
              size="sm"
              variant="destructive"
            >
              {deletingId === product.id ? "🗑️ Deleting..." : " 🗑️ Delete"}
            </Button>
          </div>
        );
      },
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["get-products"],
    queryFn: async () => {
      const res = await axios.get("/api/products");
      const result: ProductApiResponse = await res.data;
      if (result.success) {
        return result.data;
      }
    },
  });

  const { mutate } = useMutation({
    mutationKey: ["delete-product"],
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const res = await axios.delete(`/api/products/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Product deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["get-products"] });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const table = useReactTable<Product>({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="border rounded-md p-4 w-full overflow-x-auto">
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* Search bar */}
        <Input
          type="text"
          placeholder="Search products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border rounded-md shadow"
        />

        {/* Column visibility dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              Columns <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  className="capitalize"
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">
          Loading products...
        </div>
      ) : data && data?.length > 0 ? (
        <>
          {/* Table */}
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <div>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          No products found!
        </div>
      )}
    </div>
  );
}
