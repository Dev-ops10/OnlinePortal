"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { addToCart, getCart } from "@/lib/cart";
import { Search, ShoppingCart, Check, Plus } from "lucide-react";
import type { Product } from "@/types/database";

export default function QuickOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("item_name");

      if (data) setProducts(data as Product[]);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.item_name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.item_group.toLowerCase().includes(q)
    );
  }, [products, search]);

  function handleQuantityChange(productId: string, value: string) {
    const qty = parseInt(value) || 0;
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  }

  function handleAddToCart(product: Product) {
    const qty = quantities[product.id] || 0;
    if (qty < 1) return;
    addToCart(product, qty);
    setQuantities((prev) => ({ ...prev, [product.id]: 0 }));
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  }

  function handleAddAll() {
    let count = 0;
    products.forEach((product) => {
      const qty = quantities[product.id] || 0;
      if (qty > 0) {
        addToCart(product, qty);
        count++;
      }
    });
    if (count > 0) {
      setQuantities({});
    }
  }

  const hasAnyQuantity = Object.values(quantities).some((q) => q > 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quick Order</h1>
          <p className="text-sm text-gray-500">
            Enter quantities and add items directly to your cart.
          </p>
        </div>
        {hasAnyQuantity && (
          <button
            onClick={handleAddAll}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-accent-hover"
          >
            <ShoppingCart className="h-4 w-4" />
            Add All to Cart
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, SKU, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Item
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">
                  SKU
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 md:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Qty
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-primary">
                      {product.item_name}
                    </div>
                    <div className="text-xs text-gray-400 sm:hidden">
                      {product.sku}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-gray-600 sm:table-cell">
                    {product.sku}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {product.item_group}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-primary">
                    ${product.price.toFixed(2)}
                    <span className="text-xs font-normal text-gray-400">
                      /{product.unit_of_measure}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={quantities[product.id] || ""}
                      onChange={(e) =>
                        handleQuantityChange(product.id, e.target.value)
                      }
                      placeholder="0"
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm font-medium focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!quantities[product.id] || quantities[product.id] < 1}
                      className={`rounded-lg p-2 transition-all ${
                        addedItems[product.id]
                          ? "bg-success text-white"
                          : quantities[product.id] && quantities[product.id] > 0
                            ? "bg-accent text-primary hover:bg-accent-hover"
                            : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      {addedItems[product.id] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No products match your search.
          </div>
        )}
      </div>
    </div>
  );
}
