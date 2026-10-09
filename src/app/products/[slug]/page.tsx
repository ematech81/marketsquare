import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Gallery from "@/components/Gallery";
import { getProduct } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) return { title: "Product not found | Square Market" };
  return {
    title: `${product.title} | Square Market`,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <Suspense fallback={<p className="text-foreground/50">Loading…</p>}>
        <Details params={params} />
      </Suspense>
    </main>
  );
}

async function Details({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  return (
    <>
      <nav className="mb-6 text-sm text-foreground/60" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-accent">
          All products
        </Link>
        {" / "}
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-accent">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery images={product.images} title={product.title} />

        <div>
          <h1 className="text-3xl font-bold leading-tight">{product.title}</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Sold by <span className="font-medium text-foreground">{product.seller.name}</span>
          </p>

          <p className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{formatNaira(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-foreground/50 line-through">{formatNaira(product.compareAtPrice)}</span>
            )}
            {discount > 0 && <span className="bg-accent px-2 py-1 text-xs font-medium text-white">-{discount}%</span>}
          </p>

          <p className={`mt-3 text-sm font-medium ${product.inStock ? "text-green-800" : "text-red-800"}`}>
            {product.inStock
              ? product.stock <= 5
                ? `Only ${product.stock} left`
                : "In stock"
              : "Out of stock"}
          </p>

          {product.variants.map((v) => (
            <div key={v.name} className="mt-6">
              <p className="mb-2 text-sm font-medium">{v.name}</p>
              <div className="flex flex-wrap gap-2">
                {v.options.map((o) => (
                  <span key={o} className="border border-foreground/30 px-3 py-2 text-sm">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <h2 className="mb-2 mt-8 text-lg font-bold">About this product</h2>
          <p className="whitespace-pre-line text-foreground/80">{product.description}</p>
        </div>
      </div>
    </>
  );
}
