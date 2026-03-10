"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import type { Profile } from "@/types/database";

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
        if (data) setProfile(data as Profile);
      }
      setLoading(false);
    }
    checkAdmin();
  }, []);

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
          className={`rounded-xl border p-6 ${
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
    </div>
  );
}
