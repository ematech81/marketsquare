import Link from "next/link";
import { Suspense } from "react";
import { buildQuery, Filters, OpenMenuButton, SortSelect, type FilterValues } from "@/components/Filters";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/catalog";
import { getStores } from "@/lib/stores";
import { formatNaira } from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = { title: "All products | Square Market" };

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-6 pb-14">
      <Suspense fallback={<p className="text-muted">Loading products…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const values: FilterValues = {
    q: first(sp.q),
    categories: first(sp.category).split(",").filter(Boolean),
    vendors: first(sp.vendor).split(",").filter(Boolean),
    minPrice: first(sp.minPrice),
    maxPrice: first(sp.maxPrice),
    fourStars: first(sp.minRating) === "4",
    inStock: first(sp.inStock) === "1",
    sort: first(sp.sort) || "newest",
  };
  const page = Math.max(1, parseInt(first(sp.page), 10) || 1);

  const [categories, stores, list] = await Promise.all([
    getCategories().catch(() => []),
    getStores(),
    getProducts({
      q: values.q,
      category: values.categories.join(","),
      vendor: values.vendors.join(","),
      minPrice: values.minPrice,
      maxPrice: values.maxPrice,
      minRating: values.fourStars ? "4" : "",
      inStock: values.inStock ? "1" : "",
      sort: values.sort,
      page: String(page),
      limit: 12,
    }).catch(() => null),
  ]);

  const selected = categories.filter((c) => values.categories.includes(c.slug));
  const title = values.q
    ? `Results for “${values.q}”`
    : selected.length === 1
      ? selected[0].name
      : "All products";

  const chips = [
    ...(values.q ? [`Search: ${values.q}`] : []),
    ...selected.map((c) => c.name),
    ...values.vendors.map((v) => (v === "house" ? "Square Market" : (stores.find((s) => s.id === v)?.name ?? "Vendor"))),
    ...(values.minPrice || values.maxPrice
      ? [`${values.minPrice ? formatNaira(Number(values.minPrice)) : "Any"} to ${values.maxPrice ? formatNaira(Number(values.maxPrice)) : "any"}`]
      : []),
    ...(values.fourStars ? ["4 stars and up"] : []),
    ...(values.inStock ? ["In stock"] : []),
  ];

  const pageHref = (n: number) => buildQuery({ ...values, page: n });
  const pageBtn = "inline-flex h-11 min-w-11 items-center justify-center rounded-sm text-sm";

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / <span className="text-foreground">{title}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="mb-1 text-4xl font-bold tracking-[-0.02em]">{title}</h1>
          <p className="text-[15px] text-[#45474B]">
            {list ? `Showing ${list.total} ${list.total === 1 ? "product" : "products"}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SortSelect values={values} />
          <OpenMenuButton />
        </div>
      </div>

      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <Filters categories={categories} vendors={stores.map((s) => ({ id: s.id, name: s.name }))} values={values} className="max-md:hidden" />

        <section className="w-full min-w-0 flex-1">
          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-[#45474B]">Active filters:</span>
              {chips.map((c) => (
                <span key={c} className="rounded-sm bg-[#FBEAE4] px-2.5 py-1.5 font-medium text-[#8A3219]">
                  {c}
                </span>
              ))}
            </div>
          )}

          {list === null ? (
            <p className="text-muted">We could not load products right now. Please try again shortly.</p>
          ) : list.products.length === 0 ? (
            <p className="rounded-sm border border-line bg-white p-6 text-[#45474B]">
              No products match your filters. Try removing some.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:gap-6 md:[grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
                {list.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {list.pages > 1 && (
                <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">
                  {Array.from({ length: list.pages }, (_, i) => i + 1).map((n) =>
                    n === list.page ? (
                      <span key={n} aria-current="page" className={`${pageBtn} bg-foreground font-semibold text-white`}>
                        {n}
                      </span>
                    ) : (
                      <Link key={n} href={pageHref(n)} className={`${pageBtn} border border-[#C6C6CB] bg-white font-medium hover:border-foreground`}>
                        {n}
                      </Link>
                    ),
                  )}
                  {list.page < list.pages && (
                    <Link href={pageHref(list.page + 1)} className={`${pageBtn} border border-[#C6C6CB] bg-white px-4 font-medium hover:border-foreground`}>
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
