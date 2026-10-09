import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/catalog";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-foreground/5">
        {image ? (
          <Image
            src={image.url}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-foreground/40">No image</div>
        )}
        {!product.inStock && (
          <span className="absolute left-0 top-0 bg-foreground px-2 py-1 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-foreground/60">{product.seller.name}</p>
      <h3 className="font-sans text-base font-medium leading-snug group-hover:text-accent">{product.title}</h3>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="font-bold">{formatNaira(product.price)}</span>
        {product.compareAtPrice && (
          <span className="text-sm text-foreground/50 line-through">{formatNaira(product.compareAtPrice)}</span>
        )}
      </p>
    </Link>
  );
}
