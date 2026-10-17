// The filters on the products page, and how they become a web address and back. This file has no "use client" line,
// so the server page, the filter panel and the phone menu can all use it.

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

// Reads the filters back out of the address bar.
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
