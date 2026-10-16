import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import BuyBox from "@/components/BuyBox";
import DeliveryCard from "@/components/DeliveryCard";
import Gallery from "@/components/Gallery";
import ProductStrip from "@/components/ProductStrip";
import QuickAdd from "@/components/QuickAdd";
import ReviewsSection from "@/components/ReviewsSection";
import RichText from "@/components/RichText";
import ShareButtons from "@/components/ShareButtons";
import ShippingFrom from "@/components/ShippingFrom";
import Stars from "@/components/Stars";
import { getProduct, getProducts } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";
import { breadcrumbJsonLd, excerpt, jsonLdString, plainText, productJsonLd, productUrl, SITE_NAME } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { getStore } from "@/lib/stores";

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
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6 pb-14 md:px-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Details params={params} />
      </Suspense>
    </main>
  );
}

const card = "rounded-sm border border-line bg-white";
const cardTitle = "border-b border-line px-5 py-4 font-display text-xl font-semibold";
const smallTitle = "text-[12px] font-semibold tracking-[0.06em] uppercase";
const sideNav = "flex min-h-12 items-center border-b border-line px-4 text-[15px] hover:bg-surface last:border-b-0";

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
  const lowStock = product.inStock && product.stock <= 5;

  const settings = await getSettings();
  const [related, fromSeller, store] = await Promise.all([
    getProducts({ category: product.category.slug, limit: 10 })
      .then((r) => r.products.filter((p) => p.id !== product.id).slice(0, 8))
      .catch(() => []),
    product.seller.id
      ? getProducts({ vendor: product.seller.id, limit: 10 })
          .then((r) => r.products.filter((p) => p.id !== product.id).slice(0, 8))
          .catch(() => [])
      : Promise.resolve([]),
    product.seller.id ? getStore(product.seller.id).catch(() => null) : Promise.resolve(null),
  ]);

  // The rows of the Specifications card: brand and code first, then whatever the seller added.
  const specs = [
    ...(product.brand ? [{ label: "Brand", value: product.brand }] : []),
    ...(product.sku ? [{ label: "SKU", value: product.sku }] : []),
    ...(product.gtin ? [{ label: "Barcode", value: product.gtin }] : []),
    ...product.details,
  ];
  const highlights = product.highlights ?? [];
  const hasSpecs = highlights.length > 0 || specs.length > 0;
  const url = productUrl(product.slug);
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <>
      {/* The data Google reads to show price, stock, brand and stars in search results. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd(product, settings.returnDays)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(product)) }} />

      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        &gt;{" "}
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>{" "}
        &gt; <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-6">
          {/* The product: photos on the left, the buying details on the right */}
          <section className={`${card} flex flex-wrap items-start gap-8 p-5`}>
            <div className="min-w-0 flex-1 basis-[300px]">
              <Gallery images={product.images} title={product.title} />
            </div>

            <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-4">
              <div className="flex flex-col gap-2">
                {discount >= 30 && (
                  <span className="self-start rounded-sm bg-accent px-2 py-1 text-xs font-bold text-foreground">Big saving</span>
                )}
                <h1 className="text-[26px] leading-[1.2] font-bold tracking-[-0.015em]">{product.title}</h1>
                {(product.brand || product.sku) && (
                  <p className="text-[13px] text-muted">
                    {product.brand && (
                      <>
                        Brand: <span className="font-medium text-foreground">{product.brand}</span>
                      </>
                    )}
                    {product.brand && product.sku && " · "}
                    {product.sku && <>Code: {product.sku}</>}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 border-y border-line py-4">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-[30px] font-bold">{formatNaira(product.price)}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-base text-muted line-through">{formatNaira(product.compareAtPrice)}</span>
                  )}
                  {discount > 0 && <span className="rounded-sm bg-[#FBEAE4] px-1.5 py-0.5 text-[13px] font-bold text-[#8A3219]">-{discount}%</span>}
                </p>
                {lowStock && <p className="text-[13px] font-semibold text-[#B42318]">Only {product.stock} left in stock</p>}
                <ShippingFrom />
                {product.ratingCount > 0 ? (
                  <a href="#reviews" className="flex items-center gap-2 text-sm text-accent-ink hover:text-foreground">
                    <Stars value={product.ratingAverage} size={18} />
                    <span>
                      ({product.ratingCount} verified {product.ratingCount === 1 ? "rating" : "ratings"})
                    </span>
                  </a>
                ) : (
                  <a href="#reviews" className="text-[13px] text-muted hover:text-foreground">
                    No ratings yet
                  </a>
                )}
              </div>

              <BuyBox productId={product.id} inStock={product.inStock} stock={product.stock} variants={product.variants} />

              <ShareButtons url={url} title={product.title} />

              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Incorrect product information: ${product.title}`)}&body=${encodeURIComponent(url)}`}
                  className="text-[13px] text-accent-ink underline hover:text-foreground"
                >
                  Report incorrect product information
                </a>
              )}
            </div>
          </section>

          <ProductStrip
            title={`More from ${product.seller.name}`}
            products={fromSeller}
            href={product.seller.id ? `/stores/${product.seller.id}` : undefined}
          />

          <section id="details" className={`${card} scroll-mt-24`}>
            <h2 className={cardTitle}>Product details</h2>
            <div className="p-5">
              <RichText>{product.description}</RichText>
              {product.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
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
            </div>
          </section>

          {hasSpecs && (
            <section id="specifications" className={`${card} scroll-mt-24`}>
              <h2 className={cardTitle}>Specifications</h2>
              <div className="flex flex-wrap gap-4 p-5">
                {highlights.length > 0 && (
                  <div className="min-w-0 flex-1 basis-[260px] rounded-sm border border-line">
                    <h3 className={`border-b border-line px-4 py-3 ${smallTitle}`}>Key features</h3>
                    <ul className="m-0 flex list-none flex-col gap-2 p-4 text-[15px] leading-snug">
                      {highlights.map((h) => (
                        <li key={h} className="flex gap-2.5">
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-accent" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {specs.length > 0 && (
                  <div className="min-w-0 flex-1 basis-[260px] rounded-sm border border-line">
                    <h3 className={`border-b border-line px-4 py-3 ${smallTitle}`}>Specifications</h3>
                    <table className="w-full border-collapse text-[15px]">
                      <tbody>
                        {specs.map((d) => (
                          <tr key={d.label} className="border-b border-line last:border-0">
                            <th scope="row" className="w-2/5 px-4 py-2.5 text-left font-semibold">
                              {d.label}
                            </th>
                            <td className="px-4 py-2.5 text-[#45474B]">{d.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          <div id="reviews" className={`${card} scroll-mt-24 p-5 [&>section]:mt-0`}>
            <ReviewsSection slug={product.slug} />
          </div>

          <ProductStrip title="Products related to this item" products={related} href={`/products?category=${product.category.slug}`} />
        </div>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-6 self-stretch lg:max-w-[380px]">
          <DeliveryCard />

          <section className={card} aria-labelledby="seller-heading">
            <h2 id="seller-heading" className={`px-4 py-3 ${smallTitle}`}>
              Seller information
            </h2>
            <div className="flex items-center gap-3.5 border-t border-line p-4">
              <span className="flex size-12 shrink-0 items-center justify-center bg-foreground font-display text-xl font-bold text-white">
                {product.seller.name.charAt(0)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="text-[15px]">{product.seller.name}</strong>
                <span className="text-[13px] text-muted">{product.seller.id ? "Approved vendor" : "Sold and delivered by Square Market"}</span>
              </div>
            </div>
            {store && (
              <ul className="m-0 flex list-none flex-col gap-1.5 border-t border-line p-4 text-[13px] text-[#45474B]">
                <li>
                  Based in {store.city}, {store.state}
                </li>
                <li>
                  {store.productCount} {store.productCount === 1 ? "product" : "products"} on Square Market
                </li>
                {store.since && <li>Selling here since {new Date(store.since).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</li>}
              </ul>
            )}
            {product.seller.id && (
              <div className="border-t border-line p-4">
                <Link
                  href={`/stores/${product.seller.id}`}
                  className="flex h-11 items-center justify-center rounded-sm border border-foreground text-sm font-semibold hover:bg-surface"
                >
                  Visit store
                </Link>
              </div>
            )}
          </section>

          {/* Stays in view while you read down the page */}
          <div className="sticky top-4 flex flex-col gap-4">
            <nav aria-label="On this page" className={card}>
              <a href="#details" className={sideNav}>
                Product details
              </a>
              {hasSpecs && (
                <a href="#specifications" className={sideNav}>
                  Specifications
                </a>
              )}
              <a href="#reviews" className={sideNav}>
                Verified customer feedback
              </a>
            </nav>

            <div className={`${card} flex flex-col gap-3 p-4`}>
              <div className="flex gap-3">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-surface">
                  {product.images[0] && <Image src={product.images[0].url} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="line-clamp-2 text-[13px] leading-snug">{product.title}</span>
                  <span className="font-display text-lg font-bold">{formatNaira(product.price)}</span>
                </div>
              </div>
              <QuickAdd productId={product.id} href={`/products/${product.slug}`} inStock={product.inStock} hasOptions={product.variants.length > 0} />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
