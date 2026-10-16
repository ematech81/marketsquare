import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";

// A row of small product cards that scrolls sideways: "More from this seller", "Related products".
export default function ProductStrip({ title, products, href }: { title: string; products: Product[]; href?: string }) {
  if (products.length === 0) return null;
  return (
    <section className="rounded-sm border border-line bg-white p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-semibold text-accent-ink hover:text-foreground">
            See all
          </Link>
        )}
      </div>
      <ul className="m-0 flex list-none snap-x gap-4 overflow-x-auto p-0 pb-2">
        {products.map((p) => {
          const discount = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
          return (
            <li key={p.id} className="w-[148px] shrink-0 snap-start sm:w-[164px]">
              <Link href={`/products/${p.slug}`} className="flex flex-col gap-1.5 text-foreground">
                <span className="relative block aspect-square overflow-hidden rounded-sm bg-surface">
                  {p.images[0] && <Image src={p.images[0].url} alt={p.images[0].alt || p.title} fill sizes="164px" className="object-cover" />}
                  {discount > 0 && (
                    <span className="absolute top-1.5 right-1.5 rounded-sm bg-[#FBEAE4] px-1.5 py-0.5 text-[11px] font-bold text-[#8A3219]">-{discount}%</span>
                  )}
                </span>
                <span className="line-clamp-2 text-[13px] leading-snug">{p.title}</span>
                <span className="font-display text-base font-bold">{formatNaira(p.price)}</span>
                {discount > 0 && p.compareAtPrice && <span className="-mt-1 text-xs text-muted line-through">{formatNaira(p.compareAtPrice)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
