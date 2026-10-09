"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type FilterValues = {
  q: string;
  categories: string[];
  minPrice: string;
  maxPrice: string;
  fourStars: boolean;
  inStock: boolean;
  sort: string;
};

export function buildQuery(v: Partial<FilterValues> & { page?: number }) {
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.categories?.length) p.set("category", v.categories.join(","));
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
  values,
}: {
  categories: { name: string; slug: string }[];
  values: FilterValues;
}) {
  const router = useRouter();
  const go = (patch: Partial<FilterValues>) => router.push(buildQuery({ ...values, ...patch }));

  return (
    <aside className="flex flex-col gap-6 rounded-sm border border-line bg-white p-5 lg:w-65 lg:shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Filters</h2>
        <Link href={values.q ? `/products?q=${encodeURIComponent(values.q)}` : "/products"} className="text-[13px] font-semibold text-accent-ink hover:text-foreground">
          Clear all
        </Link>
      </div>

      {categories.length > 0 && (
        <fieldset className="flex flex-col gap-1 border-0 p-0">
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
