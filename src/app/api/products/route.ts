import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Papa from "papaparse";

interface CSVRow {
  "Item No."?: string;
  "Item Description"?: string;
  "In-stock"?: string;
  image_url?: string;
  "Item Group"?: string;
  customer_groups?: string;
  unit_of_measure?: string;
  is_active?: string;
}

export async function POST(request: Request) {
  try {
    // Verify admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse CSV from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const parsed = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing errors",
          details: parsed.errors.slice(0, 5).map((e) => e.message),
        },
        { status: 400 }
      );
    }

    // Use service client for upsert (bypasses RLS)
    const serviceClient = await createServiceClient();

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of parsed.data) {
      const sku = row["Item No."]?.trim();
      const itemName = row["Item Description"]?.trim();

      if (!sku || !itemName) {
        errors.push(`Skipped row: missing Item No. or Item Description`);
        continue;
      }

      const inStock = row["In-stock"] !== undefined
        ? parseFloat(row["In-stock"]) || 0
        : null;

      const customerGroups = row.customer_groups
        ? row.customer_groups.split("|")
            .map((g) => g.trim())
            .filter(Boolean)
        : [];

      // is_active: explicit column wins, then fall back to in-stock > 0
      let isActive = true;
      if (row.is_active !== undefined) {
        isActive = row.is_active.toLowerCase() === "true" || row.is_active === "1";
      } else if (inStock !== null) {
        isActive = inStock > 0;
      }

      const productData = {
        item_name: itemName,
        sku: sku,
        item_group: row["Item Group"]?.trim() || "General",
        price: 0,
        image_url: row.image_url?.trim() || null,
        description: null,
        customer_groups: customerGroups,
        unit_of_measure: row.unit_of_measure?.trim() || "EA",
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      // Check if product exists
      const { data: existing } = await serviceClient
        .from("products")
        .select("id")
        .eq("sku", productData.sku)
        .single();

      if (existing) {
        const { error: updateError } = await serviceClient
          .from("products")
          .update(productData)
          .eq("sku", productData.sku);

        if (updateError) {
          errors.push(`Failed to update ${productData.sku}: ${updateError.message}`);
        } else {
          updated++;
        }
      } else {
        const { error: insertError } = await serviceClient
          .from("products")
          .insert(productData);

        if (insertError) {
          errors.push(`Failed to insert ${productData.sku}: ${insertError.message}`);
        } else {
          inserted++;
        }
      }
    }

    return NextResponse.json({ inserted, updated, errors });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
