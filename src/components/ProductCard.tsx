"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/types/database";

export default function ProductCard({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (quantity < 1) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setQuantity(1);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.item_name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <Package className="h-16 w-16" />
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-md bg-primary/90 px-2 py-0.5 text-xs font-medium text-white">
          {product.item_group}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-gray-400">{product.sku}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-primary">
          {product.item_name}
        </h3>
        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">per {product.unit_of_measure}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 rounded-lg border border-gray-200 px-2 py-2 text-center text-sm font-medium focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleAdd}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                added
                  ? "bg-success text-white"
                  : "bg-accent text-primary hover:bg-accent-hover"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
