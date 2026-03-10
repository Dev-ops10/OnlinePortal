"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import type { Order, OrderItem } from "@/types/database";

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (data) setOrders(data as OrderWithItems[]);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <ClipboardList className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-xl font-bold text-primary">No orders yet</h2>
        <p className="text-sm text-gray-500">
          Your submitted orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-primary">Order History</h1>

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <button
              onClick={() =>
                setExpanded(expanded === order.id ? null : order.id)
              }
              className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:px-6"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm font-bold text-primary">
                  {order.order_number}
                </span>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {order.status}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary">
                  ${order.total.toFixed(2)}
                </span>
                {expanded === order.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>

            {expanded === order.id && (
              <div className="border-t border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500 sm:px-6">
                        Item
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-500">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500 sm:px-6">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.order_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 sm:px-6">
                          <div className="text-sm font-medium text-primary">
                            {item.item_name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.sku} &middot; $
                            {item.unit_price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center text-sm">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium sm:px-6">
                          ${item.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {order.notes && (
                  <div className="border-t border-gray-100 px-4 py-3 sm:px-6">
                    <p className="text-xs font-medium text-gray-400">Notes</p>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
