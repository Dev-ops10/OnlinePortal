"use client";

import { useState } from "react";
import { Shield, Check, AlertTriangle, Loader2 } from "lucide-react";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  async function handleSetup() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/setup", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || "Setup failed" });
      } else {
        setResult({ success: true, message: data.message });
        // Full page reload to refresh Navbar with admin role
        setTimeout(() => {
          window.location.href = "/catalog";
        }, 1500);
      }
    } catch {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <Shield className="mx-auto mb-4 h-16 w-16 text-accent" />
        <h1 className="mb-2 text-2xl font-bold text-primary">Admin Setup</h1>
        <p className="mb-6 text-sm text-gray-500">
          Promote your account to admin. This only works if no admin exists yet.
        </p>

        <button
          onClick={handleSetup}
          disabled={loading || result?.success === true}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-bold text-primary transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            "Make Me Admin"
          )}
        </button>

        {result?.success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>{result.message} Redirecting to catalog...</span>
          </div>
        )}

        {result?.error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{result.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
