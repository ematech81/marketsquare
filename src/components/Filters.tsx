"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type FilterValues = {
  q: string;
  categories: string[];
  vendors: string[];
  minPrice: string;
  maxPrice: string;
  fourStars: boolean;
  inStock: boolean;
  sort: string;
};

// Reads the filters back out of the address bar. The menu on phones uses this, because it is not part of the page.
export function valuesFromParams(get: (key: string) => string | null): FilterValues {
  const list = (v: string | null) => (v ?? "").split(",").filter(Boolean);
  return {
    q: get("q") ?? "",
    categories: list(get("category")),
    vendors: list(get("vendor")),
    minPrice: get("minPrice") ?? "",
    maxPrice: get("maxPrice") ?? "",
    fourStars: get("minRating") === "4",
    inStock: get("inStock") === "1",
    sort: get("sort") || "newest",
  };
}

export function buildQuery(v: Partial<FilterValues> & { page?: number }) {
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.categories?.length) p.set("category", v.categories.join(","));
  if (v.vendors?.length) p.set("vendor", v.vendors.join(","));
  if (v.minPrice) p.set("minPrice", v.minPrice);
  if (v.maxPrice) p.set("maxPrice", v.maxPrice);
  if (v.fourStars) p.set("minRating", "4");
  if (v.inStock) p.set("inStock", "1");
  if (v.sort && v.sort !== "newest") p.set("sort", v.sort);
  if (v.page && v.page > 1) p.set("page", String(v.page));
  const s = p.toString();
  return s ? `/products?${s}` : "/products";
}

const legend = "mb-2 p-0 text-sm font-semibold";
const check = "flex min-h-9 items-center gap-2.5 text-sm";
const box = "m-0 size-[18px] accent-accent";
const priceInput =
  "h-11 w-full min-w-0 rounded-sm border border-[#C6C6CB] px-2.5 text-sm outline-none focus:border-accent";

export function Filters({
  categories,
  vendors = [],
  values,
  variant = "panel",
  className = "",
  hideCategories = false,
  onApply,
}: {
  categories: { name: string; slug: string }[];
  // "house" is the store's own products. Only shown when vendors are selling.
  vendors?: { id: string; name: string }[];
  values: FilterValues;
  // "drawer" is the version inside the phone menu: no box around it.
  variant?: "panel" | "drawer";
  className?: string;
  // The phone menu already lists the categories, so it leaves them out here.
  hideCategories?: boolean;
  // The "Show results" button in the phone menu.
  onApply?: () => void;
}) {
  const router = useRouter();
  const go = (patch: Partial<FilterValues>) => router.push(buildQuery({ ...values, ...patch }));

  return (
    <aside
      className={`flex flex-col gap-6 ${variant === "drawer" ? "px-5 py-5" : "rounded-sm border border-line bg-white p-5 lg:w-65 lg:shrink-0"} ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Filters</h2>
        <Link href={values.q ? `/products?q=${encodeURIComponent(values.q)}` : "/products"} className="text-[13px] font-semibold text-accent-ink hover:text-foreground">
          Clear all
        </Link>
      </div>

      {categories.length > 0 && !hideCategories && (
        <fieldset className="flex max-h-56 flex-col gap-1 overflow-y-auto overscroll-contain border-0 p-0">
          <legend className={legend}>Category</legend>
          {categories.map((c) => (
            <label key={c.slug} className={check}>
              <input
                type="checkbox"
                className={box}
                checked={values.categories.includes(c.slug)}
                onChange={(e) =>
                  go({
                    categories: e.target.checked
                      ? [...values.categories, c.slug]
                      : values.categories.filter((s) => s !== c.slug),
                  })
                }
              />
              {c.name}
            </label>
          ))}
        </fieldset>
      )}

      {vendors.length > 0 && (
        <fieldset className="flex flex-col gap-1 border-0 p-0">
          <legend className={legend}>Vendor</legend>
          {[{ id: "house", name: "Square Market" }, ...vendors].map((v) => (
            <label key={v.id} className={check}>
              <input
                type="checkbox"
                className={box}
                checked={values.vendors.includes(v.id)}
                onChange={(e) =>
                  go({
                    vendors: e.target.checked ? [...values.vendors, v.id] : values.vendors.filter((x) => x !== v.id),
                  })
                }
              />
              {v.name}
            </label>
          ))}
        </fieldset>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          go({ minPrice: String(f.get("min") ?? ""), maxPrice: String(f.get("max") ?? "") });
        }}
      >
        <fieldset className="border-0 p-0">
          <legend className={legend}>Price (₦)</legend>
          <div className="flex items-center gap-2">
            <input
              key={`min-${values.minPrice}`}
              name="min"
              type="number"
              min={0}
              aria-label="Minimum price"
              placeholder="Min"
              defaultValue={values.minPrice}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              className={priceInput}
            />
            <span className="text-muted">to</span>
            <input
              key={`max-${values.maxPrice}`}
              name="max"
              type="number"
              min={0}
              aria-label="Maximum price"
              placeholder="Max"
              defaultValue={values.maxPrice}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              className={priceInput}
            />
          </div>
        </fieldset>
      </form>

      <fieldset className="flex flex-col gap-1 border-0 p-0">
        <legend className={legend}>Rating</legend>
        <label className={check}>
          <input type="radio" name="rating" className={box} checked={values.fourStars} onChange={() => go({ fourStars: true })} />
          4 stars and up
        </label>
        <label className={check}>
          <input type="radio" name="rating" className={box} checked={!values.fourStars} onChange={() => go({ fourStars: false })} />
          Any rating
        </label>
      </fieldset>

      <label className={`${check} border-t border-line pt-4 font-medium`}>
        <input type="checkbox" className={box} checked={values.inStock} onChange={(e) => go({ inStock: e.target.checked })} />
        In stock only
      </label>

      {onApply && (
        <button type="button" onClick={onApply} className="h-12 cursor-pointer rounded-sm bg-accent text-[15px] font-semibold text-foreground hover:brightness-95">
          Show results
        </button>
      )}
    </aside>
  );
}

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export function SortSelect({ values }: { values: FilterValues }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-[#45474B]">
        Sort by
      </label>
      <select
        id="sort"
        value={values.sort}
        onChange={(e) => router.push(buildQuery({ ...values, sort: e.target.value }))}
        className="h-11 rounded-sm border border-[#C6C6CB] bg-white px-3 text-sm"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Phones only: opens the side menu, where the filters are.
export function OpenMenuButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("sm-open-menu"))}
      className="flex h-11 cursor-pointer items-center gap-2 rounded-sm border border-[#C6C6CB] bg-white px-4 text-sm font-semibold hover:border-foreground md:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </svg>
      Filter
    </button>
  );
}
