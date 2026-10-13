import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type ListedProduct = { slug: string; updatedAt?: string; images: { url: string }[] };

// Lists the home page, the catalog, the legal pages, every vendor store and EVERY live product (with its photos)
// so search engines can find them all.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/delivery-and-returns`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const products: ListedProduct[] = [];
    // The API returns up to 48 products per page, so read every page.
    for (let page = 1; page <= 200; page += 1) {
      const res = await fetch(`${API}/products?limit=48&page=${page}`);
      const data = (await res.json()) as { products: ListedProduct[]; pages: number };
      products.push(...data.products);
      if (page >= data.pages) break;
    }

    const stores = await fetch(`${API}/stores`)
      .then((r) => r.json() as Promise<{ stores: { id: string }[] }>)
      .then((d) => d.stores)
      .catch(() => []);

    return [
      ...pages,
      ...stores.map((s) => ({ url: `${SITE_URL}/stores/${s.id}`, changeFrequency: "weekly" as const, priority: 0.5 })),
      ...products.map((p) => ({
        url: `${SITE_URL}/products/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: p.images.slice(0, 5).map((i) => i.url),
      })),
    ];
  } catch {
    // If the API is down, still serve the pages we know about.
    return pages;
  }
}
