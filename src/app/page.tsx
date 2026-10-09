import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/catalog";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <section className="mb-12 border border-foreground/15 bg-foreground/[0.03] p-8 sm:p-12">
        <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">Shop trusted sellers across Nigeria</h1>
        <p className="mt-4 max-w-lg text-foreground/70">
          Pay once, track every order, and get it delivered to your door.
        </p>
        <Link href="/products" className="mt-6 inline-block bg-accent px-6 py-3 font-medium text-white hover:opacity-90">
          Browse all products
        </Link>
      </section>

      <Suspense fallback={<p className="text-foreground/50">Loading…</p>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

async function HomeContent() {
  const [categories, latest] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ limit: 8 }).catch(() => null),
  ]);

  return (
    <>
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">Shop by category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/products?category=${c.slug}`}
                className="border border-foreground/30 px-4 py-3 hover:border-accent hover:text-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-bold">New arrivals</h2>
        {latest === null ? (
          <p className="text-foreground/60">We could not load products right now. Please try again shortly.</p>
        ) : latest.products.length === 0 ? (
          <p className="text-foreground/60">Products are coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {latest.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
