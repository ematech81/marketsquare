import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import BuyBox from "@/components/BuyBox";
import DeliveryCard from "@/components/DeliveryCard";
import Gallery from "@/components/Gallery";
import ReviewsSection from "@/components/ReviewsSection";
import { getProduct, getProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
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
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-6 pb-14">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Details params={params} />
      </Suspense>
    </main>
  );
}

const sectionTitle = "mb-5 font-display text-[26px] font-semibold";

async function Details({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  const settings = await getSettings();
  const related = await getProducts({ category: product.category.slug, limit: 5 })
    .then((r) => r.products.filter((p) => p.id !== product.id).slice(0, 4))
    .catch(() => []);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        /{" "}
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>{" "}
        / <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-10">
        <section className="min-w-0 flex-1 basis-[520px]">
          <Gallery images={product.images} title={product.title} />
        </section>

        <section className="flex min-w-0 flex-1 basis-[420px] flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-semibold text-accent-ink">Sold by {product.seller.name}</span>
            <h1 className="text-[34px] leading-[1.15] font-bold tracking-[-0.02em]">{product.title}</h1>
            {product.ratingCount > 0 && (
              <div className="text-sm font-semibold text-accent-ink">
                ★ {product.ratingAverage.toFixed(1)} <span className="font-normal text-[#45474B]">({product.ratingCount})</span>
              </div>
            )}
          </div>

          <p className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-[32px] font-bold">{formatNaira(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-muted line-through">{formatNaira(product.compareAtPrice)}</span>
            )}
            {discount > 0 && <span className="bg-accent px-2 py-1 text-xs font-semibold text-foreground">-{discount}%</span>}
          </p>

          <BuyBox productId={product.id} inStock={product.inStock} stock={product.stock} variants={product.variants} />

          <DeliveryCard />

          <div className="flex items-center gap-3.5 rounded-sm border border-line bg-white p-4">
            <span className="flex size-12 shrink-0 items-center justify-center bg-foreground font-display text-xl font-bold text-white">
              {product.seller.name.charAt(0)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="text-[15px]">{product.seller.name}</strong>
              <span className="text-[13px] text-muted">
                {product.seller.id ? "Approved vendor" : "Sold and delivered by Square Market"}
              </span>
            </div>
          </div>

          <div className="border-t border-line">
            <details open className="border-b border-line py-3.5">
              <summary className="flex cursor-pointer list-none justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                <span>Description</span>
                <span aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-[#45474B]">{product.description}</p>
            </details>
            <details className="border-b border-line py-3.5">
              <summary className="flex cursor-pointer list-none justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                <span>Delivery and returns</span>
                <span aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-[#45474B]">
                We deliver to you ourselves. Orders must total at least {formatNaira(settings.minOrderAmount)}. You can return an item
                within {settings.returnDays} days of delivery.{" "}
                <Link href="/delivery-and-returns" className="font-semibold text-accent-ink underline">
                  Read the full policy
                </Link>
              </p>
            </details>
          </div>
        </section>
      </div>

      <ReviewsSection slug={product.slug} />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className={sectionTitle}>More in {product.category.name}</h2>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {related.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="flex flex-col rounded-sm border border-line bg-white text-foreground">
                <span className="relative block aspect-square bg-surface">
                  {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="220px" className="object-cover" />}
                </span>
                <span className="flex flex-col gap-1.5 p-3.5">
                  <span className="text-[15px] font-semibold">{p.title}</span>
                  <span className="font-display text-lg font-bold">{formatNaira(p.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
