"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b border-foreground/15">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          Square Market
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/become-a-vendor" className="hover:text-accent">
            Sell on Square Market
          </Link>
          {loading ? null : user ? (
            <>
              <span className="hidden text-foreground/60 sm:inline">{user.name}</span>
              <button onClick={signOut} className="hover:text-accent">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="hover:text-accent">
                Sign in
              </Link>
              <Link href="/signup" className="bg-accent px-4 py-2 font-medium text-white hover:opacity-90">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
