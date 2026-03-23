"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCart, clearCart } from "@/lib/cart";
import { CheckCircle, Loader2 } from "lucide-react";
import type { CartItem, Profile } from "@/types/database";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(getCart());

    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data as Profile);
      }
    }
    loadProfile();
  }, []);

  async function handleSubmitOrder() {
    if (!profile || cart.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product_id: item.product.id,
            sku: item.product.sku,
            item_name: item.product.item_name,
            quantity: item.quantity,
            unit_price: 0,
          })),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit order");
      }

      setOrderNumber(data.order_number);
      clearCart();
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Order confirmed
  if (orderNumber) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-6 rounded-full bg-green-100 p-4">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-primary">
          Order Submitted
        </h1>
        <p className="mb-1 text-lg font-semibold text-accent">{orderNumber}</p>
        <p className="mb-8 text-sm text-gray-500">
          A confirmation email will be sent to {profile?.email}.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/orders")}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-light"
          >
            View Orders
          </button>
          <button
            onClick={() => router.push("/catalog")}
            className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-gray-50"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !orderNumber) {
    if (typeof window !== "undefined") {
      router.push("/cart");
    }
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-primary">Checkout</h1>

      {/* Order Details */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Ship To
        </h2>
        <p className="text-lg font-bold text-primary">{profile?.company}</p>
        <p className="text-sm text-gray-500">
          {profile?.full_name} &middot; {profile?.customer_group}
        </p>
      </div>

      {/* Line Items */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Item
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cart.map((item) => (
              <tr key={item.product.id}>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-primary">
                    {item.product.item_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.product.sku} &middot; {item.product.unit_of_measure}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-sm font-medium">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold">
                  {item.quantity} {item.product.unit_of_measure}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <label className="mb-2 block text-sm font-semibold text-primary">
          Order Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special instructions, delivery notes..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Totals & Submit */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Items</span>
            <span className="font-medium">{cart.length}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold text-primary">
            <span>Total Quantity</span>
            <span>{itemCount}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmitOrder}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3.5 text-sm font-bold text-primary transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Order...
            </>
          ) : (
            "Submit Sales Order"
          )}
        </button>
        <p className="mt-3 text-center text-xs text-gray-400">
          No credit card will be charged. This generates a sales order for
          processing.
        </p>
      </div>
    </div>
  );
}
