import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    );
    const tax = 0; // Configurable
    const total = subtotal + tax;

    // Generate order number
    const { data: orderNumResult } = await supabase.rpc(
      "generate_order_number"
    );
    const orderNumber = orderNumResult || `SO-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        company: profile.company,
        customer_group: profile.customer_group,
        status: "pending",
        subtotal,
        tax,
        total,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map(
      (item: {
        product_id: string;
        sku: string;
        item_name: string;
        quantity: number;
        unit_price: number;
      }) => ({
        order_id: order.id,
        product_id: item.product_id,
        sku: item.sku,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      })
    );

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      // Clean up the order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Send confirmation email (non-blocking)
    sendOrderConfirmation(order, orderItems, profile).catch(console.error);

    return NextResponse.json({
      order_id: order.id,
      order_number: orderNumber,
      total,
    });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendOrderConfirmation(
  order: Record<string, unknown>,
  items: Array<Record<string, unknown>>,
  profile: Record<string, unknown>
) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ORDER_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    console.log("Email not configured, skipping order confirmation");
    return;
  }

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.item_name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.sku}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.line_total).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0f172a;color:white;padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Order Confirmation</h1>
        <p style="margin:8px 0 0;color:#f59e0b;font-size:18px;font-weight:bold;">${order.order_number}</p>
      </div>
      <div style="padding:24px;">
        <p>Dear ${profile.full_name},</p>
        <p>Your sales order has been submitted successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:8px;text-align:left;">Item</th>
              <th style="padding:8px;text-align:left;">SKU</th>
              <th style="padding:8px;text-align:center;">Qty</th>
              <th style="padding:8px;text-align:right;">Price</th>
              <th style="padding:8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="text-align:right;font-size:18px;font-weight:bold;padding:16px 0;border-top:2px solid #0f172a;">
          Total: $${Number(order.total).toFixed(2)}
        </div>
        <p style="color:#64748b;font-size:14px;">
          Company: ${profile.company}<br/>
          Customer Group: ${profile.customer_group}
        </p>
      </div>
      <div style="background:#f8fafc;padding:16px;text-align:center;color:#94a3b8;font-size:12px;">
        This is an automated confirmation. Please do not reply to this email.
      </div>
    </div>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: profile.email,
        subject: `Order Confirmation - ${order.order_number}`,
        html,
      }),
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
