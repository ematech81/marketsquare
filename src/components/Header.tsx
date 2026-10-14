"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import MainHeader from "./MainHeader";

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
  const { user, signOut } = useAuth();
  const pathname = usePathname();

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

  // Everywhere else: the full store header with search, categories, account and cart.
  return <MainHeader />;
}
