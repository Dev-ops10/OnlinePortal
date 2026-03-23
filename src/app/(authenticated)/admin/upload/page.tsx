"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2, ImageIcon, X } from "lucide-react";
import Papa from "papaparse";
import type { Profile, Product } from "@/types/database";

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

interface UploadResult {
  inserted: number;
  updated: number;
  errors: string[];
}

export default function AdminUploadPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("item_name");
    if (data) setAllProducts(data as Product[]);
  }, []);

  useEffect(() => {
    async function checkAdmin() {
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
        if (data) {
          setProfile(data as Profile);
          if ((data as Profile).role === "admin") {
            fetchProducts();
          }
        }
      }
      setLoading(false);
    }
    checkAdmin();
  }, [fetchProducts]);

  const handleFileSelect = useCallback((file: File) => {
    setFileName(file.name);
    setResult(null);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5));
      },
    });
  }, []);

  async function handleUpload() {
    const input = document.getElementById("csv-input") as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);
      setPreview([]);
      setFileName("");
      if (input) input.value = "";
    } catch (err) {
      setResult({
        inserted: 0,
        updated: 0,
        errors: [err instanceof Error ? err.message : "Upload failed"],
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleImageUpload(product: Product, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be under 5MB");
      return;
    }

    setUploadingImageFor(product.id);
    setImageError(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${product.sku}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setImageError(`Upload failed: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      const response = await fetch("/api/products/image", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, imageUrl: publicUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        setImageError(data.error || "Failed to update product image");
        return;
      }

      await fetchProducts();
    } catch {
      setImageError("Failed to upload image");
    } finally {
      setUploadingImageFor(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-danger" />
        <h2 className="mb-2 text-xl font-bold text-primary">Access Denied</h2>
        <p className="text-sm text-gray-500">
          You do not have admin privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold text-primary">
        Product Upload
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Upload your SAP B1 Item Master CSV to upsert products by SKU.
      </p>

      {/* CSV Format Guide */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
          Accepted CSV Formats
        </h3>
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">SAP B1 Format (recommended):</p>
            <div className="overflow-x-auto">
              <code className="block whitespace-nowrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                Item No.,Item Description,In Stock,Item Group
              </code>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">Legacy Format:</p>
            <div className="overflow-x-auto">
              <code className="block whitespace-nowrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                ItemName,SKU,Category,Price,ImageURL,Description,CustomerGroups,UnitOfMeasure
              </code>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          <strong>Item No. / SKU</strong> is the unique key used for upsert (update or insert).
          <br />
          <strong>In Stock:</strong> Numeric quantity. Products with 0 stock are marked inactive.
          <br />
          <strong>Optional columns:</strong> Price (defaults to $0), CustomerGroups (pipe-separated, defaults to all groups), UnitOfMeasure (defaults to EA).
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-accent hover:bg-accent/5"
          onClick={() => document.getElementById("csv-input")?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith(".csv")) {
              const input = document.getElementById("csv-input") as HTMLInputElement;
              const dt = new DataTransfer();
              dt.items.add(file);
              input.files = dt.files;
              handleFileSelect(file);
            }
          }}
        >
          {fileName ? (
            <FileSpreadsheet className="mb-3 h-10 w-10 text-accent" />
          ) : (
            <Upload className="mb-3 h-10 w-10 text-gray-300" />
          )}
          <p className="text-sm font-medium text-primary">
            {fileName || "Drop CSV file here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Only .csv files are accepted
          </p>
        </div>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Preview (first 5 rows)
            </h4>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">
                      Item No. / SKU
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">
                      Item Description
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">
                      Category / Item Group
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">
                      In Stock / Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-gray-500">
                        {row["Item No."] || row.SKU}
                      </td>
                      <td className="px-3 py-1.5 text-primary">
                        {row["Item Description"] || row.ItemName}
                      </td>
                      <td className="px-3 py-1.5 text-gray-500">
                        {row["Item Group"] || row.Category}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-500">
                        {row["In Stock"] ?? row.Price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {preview.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-bold text-primary transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading & Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Upsert Products
              </>
            )}
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div
          className={`mb-6 rounded-xl border p-6 ${
            result.errors.length > 0
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.errors.length > 0 ? (
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-danger" />
            ) : (
              <Check className="h-5 w-5 flex-shrink-0 text-success" />
            )}
            <div>
              <h4 className="font-bold text-primary">Upload Complete</h4>
              <p className="mt-1 text-sm text-gray-600">
                {result.inserted} inserted, {result.updated} updated
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-red-600">
                  {result.errors.map((err, i) => (
                    <li key={i}>&bull; {err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Images Section */}
      {allProducts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary">Product Images</h2>
              <p className="text-xs text-gray-500">
                Upload images for your products (PNG, JPG, or WebP, max 5MB)
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {allProducts.filter((p) => p.image_url).length}/{allProducts.length} with images
            </span>
          </div>

          {imageError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{imageError}</span>
              <button onClick={() => setImageError(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Image</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Item Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">Category</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.item_name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono">{product.sku}</td>
                    <td className="px-3 py-2 text-sm text-primary font-medium truncate max-w-[200px]">{product.item_name}</td>
                    <td className="px-3 py-2 text-xs text-gray-500 hidden sm:table-cell">{product.category}</td>
                    <td className="px-3 py-2 text-right">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-accent hover:text-primary">
                        {uploadingImageFor === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {product.image_url ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={uploadingImageFor !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(product, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
