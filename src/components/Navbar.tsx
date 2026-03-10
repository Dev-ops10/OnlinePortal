"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCart, getCartItemCount } from "@/lib/cart";
import {
  ShoppingCart,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  ListOrdered,
  Shield,
} from "lucide-react";
import type { Profile } from "@/types/database";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
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

    function updateCartCount() {
      setCartCount(getCartItemCount(getCart()));
    }
    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    return () => window.removeEventListener("cart-updated", updateCartCount);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navLinks = [
    { href: "/catalog", label: "Catalog", icon: LayoutGrid },
    { href: "/quick-order", label: "Quick Order", icon: ClipboardList },
    { href: "/orders", label: "Orders", icon: ListOrdered },
  ];

  if (profile?.role === "admin") {
    navLinks.push({ href: "/admin/upload", label: "Admin", icon: Shield });
  }

  return (
    <nav className="sticky top-0 z-50 bg-primary text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/catalog"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <Package className="h-6 w-6 text-accent" />
            <span className="hidden sm:inline">OrderPro</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-accent"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden text-right text-xs text-white/60 lg:block">
                <div className="font-medium text-white/80">
                  {profile.company}
                </div>
                <div>{profile.customer_group}</div>
              </div>
            )}

            <Link
              href="/cart"
              className="relative rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleSignOut}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white md:flex"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-white/10 md:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="border-t border-white/10 pb-4 md:hidden">
            {profile && (
              <div className="px-3 py-2 text-xs text-white/60">
                {profile.company} &middot; {profile.customer_group}
              </div>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-white/10 text-accent"
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
