import type { Product } from "./catalog";

export const SITE_NAME = "Square Market";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Turns a Markdown description into plain text, for search-result descriptions and structured data.
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/(\*\*|__|\*|_)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// A short piece of text that ends at a whole word, with "…" if it was cut.
export function excerpt(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : cut.length).trim()}…`;
}

export const productUrl = (slug: string) => `${SITE_URL}/products/${slug}`;

// What Google reads to show price, stock, brand and stars in search results.
export function productJsonLd(product: Product, returnDays: number) {
  const description = excerpt(plainText(product.description), 500);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description,
    image: product.images.map((i) => i.url),
    category: product.category.name,
    url: productUrl(product.slug),
    offers: {
      "@type": "Offer",
      url: productUrl(product.slug),
      priceCurrency: "NGN",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: product.seller.name },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "NG",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: returnDays,
      },
    },
  };
  if (product.sku) data.sku = product.sku;
  if (product.gtin) data.gtin = product.gtin;
  if (product.brand) data.brand = { "@type": "Brand", name: product.brand };
  if (product.details.length > 0) {
    data.additionalProperty = product.details.map((d) => ({ "@type": "PropertyValue", name: d.label, value: d.value }));
  }
  if (product.ratingCount > 0) {
    data.aggregateRating = { "@type": "AggregateRating", ratingValue: product.ratingAverage, reviewCount: product.ratingCount };
  }
  return data;
}

export function breadcrumbJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(product.categoryPath?.length ? product.categoryPath : [product.category]).map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
        item: `${SITE_URL}/products?category=${c.slug}`,
      })),
      { "@type": "ListItem", position: (product.categoryPath?.length || 1) + 2, name: product.title, item: productUrl(product.slug) },
    ],
  };
}

// Safe to place inside a <script> tag.
// A "<" is written as its escape code so that text like "</script>" in a description can never close the tag early.
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
