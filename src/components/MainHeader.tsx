"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { childrenOf, flatten, topLevel } from "@/lib/categoryTree";
import CategoryNav from "./CategoryNav";
import { valuesFromParams } from "@/lib/filterQuery";
import { Filters } from "./Filters";
import NotificationBell from "./NotificationBell";
import WholesaleBar from "./WholesaleBar";

type Category = { _id: string; name: string; slug: string };
type Zone = { state: string; fee: number; estimatedDays: number };

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";
const STATE_KEY = "sm_state"; // the delivery state is shared with the product page's delivery card
const STATE_EVENT = "sm-state-change";

// ---------- small pieces ----------

const icon = "shrink-0";

const PinIcon = () => (
  <svg className={icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const SearchIcon = () => (
  <svg className={icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

const CartIcon = () => (
  <svg className={`${icon} size-[28px] md:size-[34px]`} width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 4h2.2l2 11h10.6l2-8H6.4" />
    <circle cx="9" cy="19" r="1.4" />
    <circle cx="17" cy="19" r="1.4" />
  </svg>
);

const MenuIcon = () => (
  <svg className={icon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const Chevron = () => (
  <svg className={icon} width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
    <path d="M1 3l4 4 4-4z" />
  </svg>
);

// Hover and keyboard focus outlines, in the style of the reference header.
const hit =
  "rounded-sm border border-transparent hover:border-white focus-visible:border-white focus-visible:outline-none";

// Closes a pop-up when you click outside it or press Escape.
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

// Two lines of text: a small line above a bold one.
function TwoLine({ small, big, withChevron }: { small: string; big: string; withChevron?: boolean }) {
  return (
    <span className="flex flex-col items-start text-left leading-tight">
      <span className="text-[11px] text-[#C6C6CB]">{small}</span>
      <span className="flex items-center gap-1 text-sm font-bold text-white">
        {big}
        {withChevron && <Chevron />}
      </span>
    </span>
  );
}

// ---------- delivery location ----------

function LocationPicker() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [state, setState] = useState("");
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  useEffect(() => {
    const read = () => {
      try {
        setState(localStorage.getItem(STATE_KEY) ?? "");
      } catch {
        // storage can be blocked
      }
    };
    api<{ zones: Zone[] }>("/delivery-zones")
      .then((r) => setZones(r.zones))
      .catch(() => setZones([]));
    // Deferred one tick so nothing is set during the effect itself.
    const timer = setTimeout(read, 0);
    window.addEventListener(STATE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(STATE_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  function choose(name: string) {
    try {
      localStorage.setItem(STATE_KEY, name);
    } catch {
      // ignore
    }
    setState(name);
    setOpen(false);
    window.dispatchEvent(new Event(STATE_EVENT));
  }

  const active = zones.find((z) => z.state === state);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${hit} flex min-h-11 cursor-pointer items-end gap-1 px-2 py-1 text-white`}
      >
        <PinIcon />
        <TwoLine small="Delivering to" big={active ? active.state : "Choose state"} />
      </button>

      {open && (
        <div role="dialog" aria-label="Choose your delivery state" className="absolute top-full left-0 z-50 mt-1 w-72 rounded-sm border border-line bg-white p-4 text-foreground shadow-lg">
          <p className="mb-1 font-display text-base font-semibold">Choose your delivery state</p>
          <p className="mb-3 text-[13px] text-muted">Delivery fees and times depend on where you are.</p>
          {zones.length === 0 ? (
            <p className="text-sm text-[#45474B]">Delivery states have not been set up yet.</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto border border-line">
              {zones.map((z) => (
                <li key={z.state}>
                  <button
                    type="button"
                    onClick={() => choose(z.state)}
                    className={`flex min-h-11 w-full cursor-pointer items-center justify-between px-3 text-left text-sm hover:bg-surface ${z.state === state ? "bg-surface font-semibold" : ""}`}
                  >
                    {z.state}
                    <span className="text-[13px] text-muted">
                      {z.estimatedDays} {z.estimatedDays === 1 ? "day" : "days"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- search with a category picker ----------

function SearchBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Show what is currently being searched, on the results page.
  const onResults = pathname === "/products";
  const q = onResults ? (params.get("q") ?? "") : "";
  const cats = (onResults ? params.get("category") : null)?.split(",").filter(Boolean) ?? [];
  const picked = cats.length === 1 ? cats[0] : "";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = String(f.get("q") ?? "").trim();
    const category = String(f.get("category") ?? "");
    const out = new URLSearchParams();
    if (text) out.set("q", text);
    if (category) out.set("category", category);
    const s = out.toString();
    router.push(s ? `/products?${s}` : "/products");
  }

  return (
    <form
      key={`${q}|${picked}`}
      onSubmit={onSubmit}
      role="search"
      className="flex h-11 w-full min-w-0 overflow-hidden rounded-sm bg-white focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent"
    >
      <label className="sr-only" htmlFor="search-category">
        Search in
      </label>
      <select
        id="search-category"
        name="category"
        defaultValue={picked}
        className="max-w-[9.5rem] shrink-0 cursor-pointer truncate border-0 border-r border-[#C6C6CB] bg-[#E9ECEF] px-3 text-[13px] text-[#45474B] outline-none hover:bg-[#DDE1E6]"
      >
        <option value="">All</option>
        {flatten(categories).map((c) => (
          <option key={c._id} value={c.slug}>
            {"\u00A0\u00A0".repeat(c.depth)}
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="search"
        name="q"
        defaultValue={q}
        aria-label="Search Square Market"
        placeholder="Search Square Market"
        className="min-w-0 flex-1 border-0 bg-white px-3.5 text-[15px] text-foreground outline-none"
      />
      <button type="submit" aria-label="Search" className="flex w-12 shrink-0 cursor-pointer items-center justify-center bg-accent text-foreground hover:brightness-95">
        <SearchIcon />
      </button>
    </form>
  );
}

// ---------- account menu ----------

function AccountMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  const first = user?.name.split(" ")[0];
  const link = "flex min-h-11 items-center px-4 text-sm hover:bg-surface";
  const primary = "flex min-h-11 items-center px-4 text-sm font-semibold bg-accent text-foreground hover:brightness-95";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`${hit} flex min-h-11 cursor-pointer items-center px-2 py-1`}
      >
        <TwoLine small={loading ? "Hello" : user ? `Hello, ${first}` : "Hello, sign in"} big="Account" withChevron />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-50 mt-1 w-72 rounded-sm border border-line bg-white text-foreground shadow-lg">
          {user ? (
            <>
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-[13px] text-muted">{user.email}</p>
              </div>
              <Link role="menuitem" href="/orders" onClick={close} className={link}>
                My orders
              </Link>
              {user.role === "vendor" && (
                <a role="menuitem" href={DASHBOARD_URL} className={primary}>
                  Vendor dashboard
                </a>
              )}
              {user.role === "admin" && (
                <a role="menuitem" href={DASHBOARD_URL} className={link}>
                  Admin dashboard
                </a>
              )}
              {user.role === "customer" && (
                <Link role="menuitem" href="/become-a-vendor" onClick={close} className={primary}>
                  Sell on Square Market
                </Link>
              )}
              <Link role="menuitem" href="/delivery-and-returns" onClick={close} className={link}>
                Delivery and returns
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  signOut();
                }}
                className={`${link} w-full cursor-pointer bg-[#B42318] text-left font-semibold text-white hover:bg-[#912018] hover:text-white`}
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="p-4">
              <Link
                href="/signin"
                onClick={close}
                className="flex h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold text-foreground hover:brightness-95"
              >
                Sign in
              </Link>
              <p className="mt-3 text-[13px] text-[#45474B]">
                New customer?{" "}
                <Link href="/signup" onClick={close} className="font-semibold text-accent-ink underline">
                  Start here
                </Link>
              </p>
              <p className="mt-2 text-[13px] text-[#45474B]">
                Want to sell?{" "}
                <Link href="/become-a-vendor" onClick={close} className="font-semibold text-accent-ink underline">
                  Apply as a vendor
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- the slide-out "All" menu ----------

function Drawer({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const { user, signOut } = useAuth();
  const closeRef = useRef<HTMLButtonElement>(null);
  // On the products page, phones get the filters in this menu instead of above the products.
  const pathname = usePathname();
  const params = useSearchParams();
  const onProducts = pathname === "/products";
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  // Which categories are opened to show what is inside them.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    if (!open || !onProducts) return;
    api<{ stores: { id: string; name: string }[] }>("/stores")
      .then((r) => setVendors(r.stores.map((s) => ({ id: s.id, name: s.name }))))
      .catch(() => setVendors([]));
  }, [open, onProducts]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const row = "flex min-h-12 items-center justify-between px-5 text-[15px] text-foreground hover:bg-surface";
  const primaryRow = "flex min-h-12 items-center justify-between bg-accent px-5 text-[15px] font-semibold text-foreground hover:brightness-95";

  // Fashion, and under it Men's fashion, and under that Men's shoes. A + opens what is inside a category.
  const tree = (parent: string | null, depth: number): React.ReactNode =>
    childrenOf(categories, parent).map((c) => {
      const kids = childrenOf(categories, c._id);
      return (
        <div key={c._id}>
          <div className="flex items-stretch">
            <Link
              href={`/products?category=${c.slug}`}
              onClick={onClose}
              className="flex min-h-12 min-w-0 flex-1 items-center pr-2 text-[15px] text-foreground hover:bg-surface"
              style={{ paddingLeft: 20 + depth * 18 }}
            >
              {c.name}
            </Link>
            {kids.length > 0 ? (
              <button
                type="button"
                onClick={() => toggle(c._id)}
                aria-expanded={opened.has(c._id)}
                aria-label={`${opened.has(c._id) ? "Hide" : "Show"} what is inside ${c.name}`}
                className="flex w-12 shrink-0 cursor-pointer items-center justify-center text-xl hover:bg-surface"
              >
                {opened.has(c._id) ? "−" : "+"}
              </button>
            ) : (
              <span aria-hidden className="flex w-12 shrink-0 items-center justify-center">
                ›
              </span>
            )}
          </div>
          {kids.length > 0 && opened.has(c._id) && <div className="bg-[#F8F9FA]">{tree(c._id, depth + 1)}</div>}
        </div>
      );
    });

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 cursor-default bg-black/60" tabIndex={-1} />
      <div role="dialog" aria-modal="true" aria-label="All categories" className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto bg-white text-foreground">
        <div className="flex items-center justify-between bg-[#1B1F27] px-5 py-4 text-white">
          <span className="font-display text-lg font-bold">{user ? `Hello, ${user.name.split(" ")[0]}` : "Hello, sign in"}</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" className="flex size-10 cursor-pointer items-center justify-center rounded-sm text-2xl hover:bg-white/10">
            ×
          </button>
        </div>

        <p className="px-5 pt-5 pb-2 font-display text-lg font-semibold">Shop by category</p>
        {/* Scrolls on its own, so a long list of categories does not push everything else off the screen */}
        <div className="max-h-[38vh] overflow-y-auto overscroll-contain">
          <Link href="/products" onClick={onClose} className={row}>
            All products <span aria-hidden>›</span>
          </Link>
          {tree(null, 0)}
        </div>

        {onProducts && (
          <div className="mt-2 border-t border-line md:hidden">
            <Filters categories={categories} vendors={vendors} values={valuesFromParams((k) => params.get(k))} variant="drawer" hideCategories onApply={onClose} />
          </div>
        )}

        <p className="mt-2 border-t border-line px-5 pt-5 pb-2 font-display text-lg font-semibold">Help and account</p>
        {user ? (
          <>
            <Link href="/orders" onClick={onClose} className={row}>
              My orders
            </Link>
            {user.role !== "customer" && (
              <a href={DASHBOARD_URL} className={user.role === "vendor" ? primaryRow : row}>
                {user.role === "admin" ? "Admin dashboard" : "Vendor dashboard"}
              </a>
            )}
          </>
        ) : (
          <Link href="/signin" onClick={onClose} className={row}>
            Sign in
          </Link>
        )}
        {user?.role !== "vendor" && user?.role !== "admin" && (
          <Link href="/become-a-vendor" onClick={onClose} className={primaryRow}>
            Sell on Square Market
          </Link>
        )}
        <Link href="/delivery-and-returns" onClick={onClose} className={row}>
          Delivery and returns
        </Link>
        {user && (
          <button
            type="button"
            onClick={() => {
              onClose();
              signOut();
            }}
            className="flex min-h-12 w-full cursor-pointer items-center bg-[#B42318] px-5 text-left text-[15px] font-semibold text-white hover:bg-[#912018]"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- the header ----------

// The orange button at the far end of the category row.
const sellButton =
  "my-1 ml-2 hidden min-h-8 shrink-0 items-center rounded-sm bg-accent px-3.5 text-sm font-semibold whitespace-nowrap text-foreground hover:brightness-95 md:flex";

export default function MainHeader() {
  const { cart } = useCart();
  const pathname = usePathname();
  const params = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [drawer, setDrawer] = useState(false);
  const closeDrawer = useCallback(() => setDrawer(false), []);

  // The "Select category" button on the products page asks for the menu to open.
  useEffect(() => {
    const open = () => setDrawer(true);
    window.addEventListener("sm-open-menu", open);
    return () => window.removeEventListener("sm-open-menu", open);
  }, []);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories")
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]));
  }, []);

  const { user } = useAuth();
  const activeCats = pathname === "/products" ? (params.get("category")?.split(",") ?? []) : [];

  return (
    <header className="bg-foreground text-white print:hidden">
      {/* Row 1: logo, location, search, account, orders, cart */}
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 md:flex-nowrap md:px-6">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          className={`${hit} flex size-11 cursor-pointer items-center justify-center md:hidden`}
        >
          <MenuIcon />
        </button>

        <Link href="/" className={`${hit} flex min-h-11 shrink-0 items-center gap-2 px-1 font-display text-base font-bold text-white md:gap-2.5 md:px-2 md:text-xl`}>
          <span className="inline-block size-3 bg-accent md:size-3.5" aria-hidden />
          Square Market
        </Link>

        <div className="hidden md:block">
          <LocationPicker />
        </div>

        <div className="order-4 w-full min-w-0 md:order-none md:flex-1">
          <SearchBar categories={categories} />
        </div>

        <div className="ml-auto hidden items-center gap-1 md:ml-0 md:flex">
          <AccountMenu />
          <Link href="/orders" className={`${hit} flex min-h-11 items-center px-2 py-1`}>
            <TwoLine small="Returns" big="& Orders" />
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
        <NotificationBell />
        <Link
          href="/checkout"
          aria-label={`Cart, ${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`}
          className={`${hit} flex min-h-11 items-end gap-1 px-2 py-1`}
        >
          <span className="relative">
            <CartIcon />
            <span className="absolute top-[5px] left-[57%] -translate-x-1/2 text-[11px] leading-none font-bold text-accent md:top-[7px] md:text-[14px]">
              {cart.itemCount}
            </span>
          </span>
          <span className="hidden pb-0.5 text-sm font-bold md:inline">Cart</span>
        </Link>
        </div>
      </div>

      {/* Row 2: all categories */}
      <nav aria-label="Product categories" className="bg-[#1B1F27]">
        <div className="mx-auto flex max-w-[1280px] items-center gap-1 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className={`${hit} hidden min-h-10 shrink-0 cursor-pointer items-center gap-2 px-3 text-sm font-bold md:flex`}
          >
            <MenuIcon />
            All
          </button>
          <CategoryNav categories={topLevel(categories)} activeCats={activeCats} />
          {user?.role === "vendor" ? (
            <a href={DASHBOARD_URL} className={sellButton}>
              Vendor dashboard
            </a>
          ) : user?.role === "admin" ? null : (
            <Link href="/become-a-vendor" className={sellButton}>
              {user ? "Sell on Square Market" : "Become a vendor"}
            </Link>
          )}
        </div>
      </nav>

      <WholesaleBar />

      <Drawer open={drawer} onClose={closeDrawer} categories={categories} />
    </header>
  );
}
