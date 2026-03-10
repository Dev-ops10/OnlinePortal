"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCart,
  updateCartQuantity,
  removeFromCart,
  getCartTotal,
  clearCart,
} from "@/lib/cart";
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import type { CartItem } from "@/types/database";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
    function handleUpdate() {
      setCart(getCart());
    }
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, []);

  function handleUpdateQty(productId: string, delta: number) {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;
    updateCartQuantity(productId, item.quantity + delta);
    setCart(getCart());
  }

  function handleRemove(productId: string) {
    removeFromCart(productId);
    setCart(getCart());
  }

  function handleClear() {
    clearCart();
    setCart([]);
  }

  const subtotal = getCartTotal(cart);
  const tax = subtotal * 0.0; // Tax configurable
  const total = subtotal + tax;

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <ShoppingCart className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-xl font-bold text-primary">Cart is empty</h2>
        <p className="mb-6 text-sm text-gray-500">
          Add items from the catalog or quick order form.
        </p>
        <Link
          href="/catalog"
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-accent-hover"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Shopping Cart</h1>
          <p className="text-sm text-gray-500">
            {cart.length} item{cart.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-danger hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear Cart
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-primary">
                      {item.product.item_name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {item.product.sku} &middot; $
                      {item.product.price.toFixed(2)}/
                      {item.product.unit_of_measure}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQty(item.product.id, -1)}
                      className="rounded-lg border border-gray-200 p-1.5 transition-colors hover:bg-gray-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.product.id, 1)}
                      className="rounded-lg border border-gray-200 p-1.5 transition-colors hover:bg-gray-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-sm font-bold text-primary">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.product.id)}
                    className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-primary">
              Order Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-bold text-primary transition-colors hover:bg-accent-hover"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
