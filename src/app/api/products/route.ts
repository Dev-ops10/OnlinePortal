import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Papa from "papaparse";

interface CSVRow {
  // New format columns
  "Item No."?: string;
  "Item Description"?: string;
  "In Stock"?: string;
  "Item Group"?: string;
  // Legacy format columns
  ItemName?: string;
  SKU?: string;
  Category?: string;
  Price?: string;
  ImageURL?: string;
  Description?: string;
  CustomerGroups?: string;
  UnitOfMeasure?: string;
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
      // Support both new format (Item No., Item Description, etc.) and legacy format (SKU, ItemName, etc.)
      const sku = row["Item No."]?.trim() || row.SKU?.trim();
      const itemName = row["Item Description"]?.trim() || row.ItemName?.trim();

      if (!sku || !itemName) {
        errors.push(`Skipped row: missing SKU/Item No. or ItemName/Item Description`);
        continue;
      }

      const inStock = row["In Stock"] !== undefined
        ? parseFloat(row["In Stock"]) || 0
        : null;

      const customerGroups = row.CustomerGroups
        ? row.CustomerGroups.split("|")
            .map((g) => g.trim())
            .filter(Boolean)
        : [];

      const productData = {
        item_name: itemName,
        sku: sku,
        category: row["Item Group"]?.trim() || row.Category?.trim() || "General",
        price: parseFloat(row.Price || "0") || 0,
        image_url: row.ImageURL?.trim() || null,
        description: row.Description?.trim() || null,
        customer_groups: customerGroups,
        unit_of_measure: row.UnitOfMeasure?.trim() || "EA",
        is_active: inStock !== null ? inStock > 0 : true,
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
