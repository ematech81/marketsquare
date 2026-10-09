import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/catalog";
import QuickAdd from "./QuickAdd";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const href = `/products/${product.slug}`;

  return (
    <article className="flex flex-col rounded-sm border border-line bg-white">
      <Link href={href} className="relative block aspect-square bg-surface">
        {image ? (
          <Image
            src={image.url}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <span className="block size-8 border-2 border-[#C6C6CB]" />
          </span>
        )}
      </Link>
      <div className="flex grow flex-col gap-1.5 p-4">
        <span className="text-[13px] text-muted">Sold by {product.seller.name}</span>
        <Link href={href} className="text-base leading-snug font-semibold hover:text-accent-ink">
          {product.title}
        </Link>
        {product.ratingCount > 0 && (
          <span className="text-[13px] font-semibold text-accent-ink">★ {product.ratingAverage.toFixed(1)}</span>
        )}
        <span className="mt-auto pt-2 font-display text-xl font-bold">{formatNaira(product.price)}</span>
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
