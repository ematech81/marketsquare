import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/catalog";
import { getStore } from "@/lib/stores";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const store = await getStore(id).catch(() => null);
  return { title: store ? `${store.name} | Square Market` : "Store not found | Square Market" };
}

export default function StorePage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-6 pb-14">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Store params={params} />
      </Suspense>
    </main>
  );
}

async function Store({ params }: { params: Params }) {
  const { id } = await params;
  const store = await getStore(id);
  if (!store) notFound();
  const list = await getProducts({ vendor: store.id, limit: 48 }).catch(() => null);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / <span className="text-foreground">{store.name}</span>
      </nav>

      <header className="mb-8 flex items-center gap-5 rounded-sm border border-line bg-white p-6">
        <span className="flex size-16 shrink-0 items-center justify-center bg-foreground font-display text-3xl font-bold text-white">
          {store.name.charAt(0)}
        </span>
        <div>
          <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em]">{store.name}</h1>
          <p className="text-[15px] text-[#45474B]">
            {store.category} · {store.city}, {store.state} · {store.productCount} {store.productCount === 1 ? "product" : "products"}
          </p>
          <p className="mt-1 text-[13px] text-muted">Approved vendor. Every vendor is reviewed before they sell on Square Market.</p>
        </div>
      </header>

      {list === null ? (
        <p className="text-muted">We could not load products right now. Please try again shortly.</p>
      ) : list.products.length === 0 ? (
        <p className="rounded-sm border border-line bg-white p-6 text-[#45474B]">This store has no products right now.</p>
      ) : (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]">
          {list.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
