import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import BuyBox from "@/components/BuyBox";
import DeliveryCard from "@/components/DeliveryCard";
import Gallery from "@/components/Gallery";
import ReviewsSection from "@/components/ReviewsSection";
import RichText from "@/components/RichText";
import { getProduct, getProducts } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";
import { breadcrumbJsonLd, excerpt, jsonLdString, plainText, productJsonLd, productUrl, SITE_NAME } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

type Params = Promise<{ slug: string }>;

// What Google and social apps show for this page. The vendor's own search title and description win;
// without them we build them from the product name and description, always ending with the site name.
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) return { title: `Product not found | ${SITE_NAME}`, robots: { index: false, follow: false } };

  const title = product.seoTitle || `${product.title} | ${SITE_NAME}`;
  const description = product.seoDescription || excerpt(plainText(product.description), 155);
  const url = productUrl(product.slug);
  const images = product.images.slice(0, 4).map((i) => ({ url: i.url, alt: i.alt || product.title }));

  return {
    title: { absolute: title },
    description,
    keywords: product.tags.length > 0 ? product.tags : undefined,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: "en_NG", type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url).slice(0, 1) },
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
const summary =
  "flex cursor-pointer list-none justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden";

async function Details({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  // An old web address: send visitors (and Google) to the current one.
  if (product.slug !== slug) permanentRedirect(`/products/${product.slug}`);

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
      {/* The data Google reads to show price, stock, brand and stars in search results. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(product, settings.returnDays)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(product)) }} />

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
            {product.seller.id ? (
              <Link href={`/stores/${product.seller.id}`} className="text-sm font-semibold text-accent-ink hover:text-foreground">
                Sold by {product.seller.name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-accent-ink">Sold by {product.seller.name}</span>
            )}
            <h1 className="text-[34px] leading-[1.15] font-bold tracking-[-0.02em]">{product.title}</h1>
            {(product.brand || product.sku) && (
              <p className="text-[13px] text-muted">
                {product.brand && <>Brand: <span className="font-medium text-foreground">{product.brand}</span></>}
                {product.brand && product.sku && " · "}
                {product.sku && <>Code: {product.sku}</>}
              </p>
            )}
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
            {product.seller.id && (
              <Link href={`/stores/${product.seller.id}`} className="text-sm font-semibold text-accent-ink hover:text-foreground">
                Visit store
              </Link>
            )}
          </div>

          <div className="border-t border-line">
            <details open className="border-b border-line py-3.5">
              <summary className={summary}>
                <span>Description</span>
                <span aria-hidden>+</span>
              </summary>
              <div className="mt-3">
                <RichText>{product.description}</RichText>
              </div>
            </details>

            {product.details.length > 0 && (
              <details open className="border-b border-line py-3.5">
                <summary className={summary}>
                  <span>Product details</span>
                  <span aria-hidden>+</span>
                </summary>
                <table className="mt-3 w-full border-collapse text-sm">
                  <tbody>
                    {product.details.map((d) => (
                      <tr key={d.label} className="border-b border-line last:border-0">
                        <th scope="row" className="w-2/5 py-2 pr-3 text-left font-normal text-muted">
                          {d.label}
                        </th>
                        <td className="py-2">{d.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}

            <details className="border-b border-line py-3.5">
              <summary className={summary}>
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

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Tags">
              {product.tags.map((t) => (
                <Link
                  key={t}
                  href={`/products?q=${encodeURIComponent(t)}`}
                  className="rounded-sm border border-line bg-white px-2.5 py-1 text-[13px] text-[#45474B] hover:border-foreground hover:text-foreground"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
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
                  {p.images[0] && <Image src={p.images[0].url} alt={p.images[0].alt || p.title} fill sizes="220px" className="object-cover" />}
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
