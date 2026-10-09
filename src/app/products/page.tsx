import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts, type ProductQuery } from "@/lib/catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = { title: "All products | Square Market" };

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">All products</h1>
      <Suspense fallback={<p className="text-foreground/50">Loading products…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const query: ProductQuery = {
    q: first(sp.q),
    category: first(sp.category),
    sort: first(sp.sort),
    minPrice: first(sp.minPrice),
    maxPrice: first(sp.maxPrice),
    page: first(sp.page),
  };

  const [categories, list] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ ...query, limit: 12 }).catch(() => null),
  ]);

  const pageLink = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, page: String(page) })) if (v) params.set(k, v);
    return `/products?${params.toString()}`;
  };

  const input = "w-full border border-foreground/30 bg-white px-3 py-2 outline-none focus:border-accent";

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <form action="/products" className="space-y-4 text-sm">
        <label className="block">
          <span className="mb-1 block font-medium">Search</span>
          <input name="q" defaultValue={query.q} placeholder="What are you looking for?" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-medium">Category</span>
          <select name="category" defaultValue={query.category ?? ""} className={input}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block font-medium">Min price (₦)</span>
            <input name="minPrice" type="number" min={0} defaultValue={query.minPrice} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Max price (₦)</span>
            <input name="maxPrice" type="number" min={0} defaultValue={query.maxPrice} className={input} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block font-medium">Sort by</span>
          <select name="sort" defaultValue={query.sort ?? "newest"} className={input}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-accent px-4 py-2 font-medium text-white hover:opacity-90">
            Apply
          </button>
          <Link href="/products" className="border border-foreground/30 px-4 py-2 hover:border-accent">
            Clear
          </Link>
        </div>
      </form>

      <div>
        {list === null ? (
          <p className="text-foreground/60">We could not load products right now. Please try again shortly.</p>
        ) : list.products.length === 0 ? (
          <p className="text-foreground/60">No products match your search. Try fewer filters.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-foreground/60">
              {list.total} {list.total === 1 ? "product" : "products"}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
              {list.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {list.pages > 1 && (
              <nav className="mt-10 flex items-center justify-between text-sm" aria-label="Pagination">
                {list.page > 1 ? (
                  <Link href={pageLink(list.page - 1)} className="border border-foreground/30 px-4 py-2 hover:border-accent">
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-foreground/60">
                  Page {list.page} of {list.pages}
                </span>
                {list.page < list.pages ? (
                  <Link href={pageLink(list.page + 1)} className="border border-foreground/30 px-4 py-2 hover:border-accent">
                    Next
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
