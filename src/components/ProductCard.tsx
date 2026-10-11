import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/catalog";
import QuickAdd from "./QuickAdd";

// The product card. The photo sits on a soft "stage" so it stands out whatever the photo's own background is:
// a light studio gradient, a tilted orange square (echoing the logo) and a ground shadow. White photo
// backgrounds blend into the stage instead of showing as a box. On hover the card lifts with an orange offset shadow.
export default function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const href = `/products/${product.slug}`;

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;
  const lowStock = product.inStock && product.stock <= 5;

  return (
    <article className="group relative flex flex-col rounded-sm border border-line bg-white transition duration-200 hover:-translate-y-1 hover:border-foreground hover:shadow-[5px_5px_0_0_var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={href} aria-label={product.title} className="relative block aspect-square overflow-hidden rounded-t-sm bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#EEF0F2_55%,#E1E5E9_100%)]">
        {/* The stage behind the product */}
        <span aria-hidden className="absolute -right-12 -bottom-12 size-44 rotate-12 bg-accent/15 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 motion-reduce:transition-none" />
        <span aria-hidden className="absolute inset-x-10 bottom-5 h-4 rounded-[50%] bg-foreground/15 blur-md" />

        {image ? (
          <Image
            src={image.url}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-5 mix-blend-multiply transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="block size-10 border-2 border-[#C6C6CB]" />
          </span>
        )}

        {!product.inStock && <span aria-hidden className="absolute inset-0 bg-white/55" />}

        <span className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="bg-accent px-2 py-1 text-xs leading-none font-bold text-foreground">-{discount}%</span>
          )}
          {lowStock && (
            <span className="bg-foreground px-2 py-1 text-xs leading-none font-semibold text-white">Only {product.stock} left</span>
          )}
          {!product.inStock && (
            <span className="bg-foreground px-2 py-1 text-xs leading-none font-semibold text-white">Out of stock</span>
          )}
        </span>

        {product.ratingCount > 0 && (
          <span className="absolute top-3 right-3 rounded-sm border border-line bg-white/90 px-2 py-1 text-xs leading-none font-bold text-accent-ink backdrop-blur-sm">
            ★ {product.ratingAverage.toFixed(1)}
          </span>
        )}
      </Link>

      <div className="flex grow flex-col gap-1 p-4 pb-3">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{product.category.name}</span>
        <Link href={href} className="line-clamp-2 min-h-[2.7em] text-base leading-snug font-semibold hover:text-accent-ink">
          {product.title}
        </Link>
        <span className="text-[13px] text-muted">Sold by {product.seller.name}</span>

        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
          <span className="font-display text-[22px] leading-none font-bold">{formatNaira(product.price)}</span>
          {discount > 0 && product.compareAtPrice && (
            <span className="text-[13px] text-muted line-through">{formatNaira(product.compareAtPrice)}</span>
          )}
        </p>
      </div>

      <div className="px-4 pb-4">
        <QuickAdd
          productId={product.id}
          href={href}
          inStock={product.inStock}
          hasOptions={product.variants.length > 0}
        />
      </div>
    </article>
  );
}
