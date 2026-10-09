import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/catalog";

// Tile colours from the design: dark, light, accent, light.
const TILES = [
  "bg-foreground text-white",
  "bg-surface text-foreground",
  "bg-accent text-foreground",
  "bg-surface text-foreground",
];

const PROMISES = [
  {
    title: "Approved vendors",
    body: "Vendors submit their business details and are reviewed before they can list products.",
  },
  {
    title: "Secure payment",
    body: "Pay with card, bank transfer or USSD through KoraPay. You pay Square Market once, even if your order has items from several vendors.",
  },
  {
    title: "Track every order",
    body: "See each step from vendor confirmation to delivery, even when your order comes from more than one vendor.",
  },
];

const buttonBase = "inline-flex min-h-12 items-center rounded-sm px-7 text-base font-semibold";

export default function Home() {
  return (
    <main className="flex-1">
      <Suspense fallback={<HeroText tiles={null} />}>
        <Hero />
      </Suspense>

      <Suspense fallback={null}>
        <Catalog />
      </Suspense>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {PROMISES.map((p) => (
            <div key={p.title} className="flex flex-col gap-2 border-t-[3px] border-accent pt-4">
              <h3 className="text-xl font-semibold">{p.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#45474B]">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-14">
          <div className="flex-1 basis-[420px]">
            <h2 className="mb-2 text-[32px] font-bold tracking-tight">Have something to sell?</h2>
            <p className="max-w-130 text-base leading-relaxed text-[#D5D8DC]">
              Apply as a vendor, list your products and manage your own stock. We collect payment from buyers and pay
              you out.
            </p>
          </div>
          <Link href="/become-a-vendor" className={`${buttonBase} bg-accent text-foreground hover:opacity-90`}>
            Apply as a vendor
          </Link>
        </div>
      </section>
    </main>
  );
}

type Tile = { name: string; slug: string };

function HeroText({ tiles }: { tiles: Tile[] | null }) {
  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-10 px-6 py-14">
        <div className="min-w-0 flex-1 basis-[440px]">
          <h1 className="mb-4 text-5xl leading-[1.1] font-bold tracking-[-0.02em]">
            Shop from approved vendors, all in one place.
          </h1>
          <p className="mb-7 max-w-130 text-lg leading-relaxed text-[#45474B]">
            Every vendor is reviewed before they sell. Pay securely with KoraPay and track your order to your door.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className={`${buttonBase} bg-accent text-foreground hover:opacity-90`}>
              Shop now
            </Link>
            <Link href="/become-a-vendor" className={`${buttonBase} border border-foreground hover:bg-surface`}>
              Sell on Square Market
            </Link>
          </div>
        </div>
        {tiles && tiles.length > 0 && (
          <div className="grid min-w-0 flex-1 basis-[380px] grid-cols-2 gap-3">
            {tiles.map((t, i) => (
              <Link
                key={t.slug}
                href={`/products?category=${t.slug}`}
                className={`flex aspect-square items-end rounded-none p-4 font-display text-xl font-semibold ${TILES[i % TILES.length]}`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

async function Hero() {
  const categories = await getCategories().catch(() => []);
  return <HeroText tiles={categories.slice(0, 4)} />;
}

async function Catalog() {
  const [categories, latest] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ limit: 8 }).catch(() => null),
  ]);

  return (
    <>
      {categories.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-6 pt-14 pb-4">
          <h2 className="mb-6 text-[28px] font-semibold tracking-tight">Shop by category</h2>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/products?category=${c.slug}`}
                className="flex min-h-11 items-center justify-between rounded-sm border border-line bg-white px-4 py-5 text-[15px] font-semibold hover:border-foreground"
              >
                {c.name}
                <span className="text-accent-ink" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[28px] font-semibold tracking-tight">New and popular</h2>
          <Link href="/products" className="text-sm font-semibold text-accent-ink hover:text-foreground">
            View all products
          </Link>
        </div>
        {latest === null ? (
          <p className="text-muted">We could not load products right now. Please try again shortly.</p>
        ) : latest.products.length === 0 ? (
          <p className="text-muted">Products are coming soon.</p>
        ) : (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {latest.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
