"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

type Category = { _id: string; name: string; slug: string };

const wrap = "mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-8 gap-y-3 px-6 py-2.5 min-h-16";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold">
      <span className="inline-block size-3.5 bg-accent" aria-hidden />
      Square Market
    </Link>
  );
}

const navLink = "inline-flex min-h-11 items-center hover:text-accent-ink";

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories")
      .then((r) => setCategories(r.categories.slice(0, 5)))
      .catch(() => setCategories([]));
  }, []);

  // The design uses a stripped-down header on checkout, on the sign-in screen and on order pages.
  if (pathname.startsWith("/checkout") || pathname.startsWith("/cart")) {
    return (
      <header className="border-b border-line bg-white print:hidden">
        <div className={`${wrap} justify-between`}>
          <Logo />
          <span className="text-sm text-[#45474B]">Secure checkout</span>
          <Link href="/products" className="text-sm font-semibold text-accent-ink hover:text-foreground">
            Continue shopping
          </Link>
        </div>
      </header>
    );
  }

  if (pathname === "/signin" || pathname === "/signup" || pathname === "/become-a-vendor") {
    return (
      <header className="border-b border-line bg-white print:hidden">
        <div className={`${wrap} justify-between`}>
          <Logo />
          <Link href="/" className="text-sm font-semibold text-accent-ink hover:text-foreground">
            Back to shop
          </Link>
        </div>
      </header>
    );
  }

  if (pathname.startsWith("/orders")) {
    return (
      <header className="border-b border-line bg-white print:hidden">
        <div className={wrap}>
          <Logo />
          <nav className="ml-auto flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <Link href="/products" className={navLink}>
              Shop
            </Link>
            <Link href="/orders" className={`${navLink} border-b-2 border-accent`}>
              My orders
            </Link>
            {user ? (
              <button onClick={signOut} className={navLink}>
                Sign out
              </button>
            ) : (
              <Link href="/signin" className={navLink}>
                Account
              </Link>
            )}
          </nav>
        </div>
      </header>
    );
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <header className="border-b border-line bg-white print:hidden">
      <div className={wrap}>
        <Logo />

        <nav aria-label="Categories" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {categories.map((c) => (
            <Link key={c._id} href={`/products?category=${c.slug}`} className="hover:text-accent-ink">
              {c.name}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} role="search" className="ml-auto max-w-[420px] min-w-60 flex-1">
          <input
            type="search"
            name="q"
            aria-label="Search products"
            placeholder="Search products"
            className="h-11 w-full rounded-sm border border-[#C6C6CB] bg-background px-3.5 text-sm outline-none focus:border-accent"
          />
        </form>

        <div className="flex items-center gap-2 text-sm font-medium">
          {loading ? null : user ? (
            <>
              <Link href="/orders" className={`${navLink} px-3`}>
                My orders
              </Link>
              <button onClick={signOut} className={`${navLink} px-3`}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/signin" className={`${navLink} px-3`}>
              Sign in
            </Link>
          )}
          <Link
            href="/checkout"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-foreground px-4 font-semibold text-white hover:opacity-90"
          >
            Cart
            {cart.itemCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center bg-accent px-1 text-xs font-bold text-foreground">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
