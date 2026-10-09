import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// Lists the home page, the catalog and every live product so search engines can find them.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/products`, changeFrequency: "daily", priority: 0.8 },
  ];
  try {
    const res = await fetch(`${API}/products?limit=48`);
    const data = (await res.json()) as { products: { slug: string }[] };
    return [...pages, ...data.products.map((p) => ({ url: `${SITE}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }))];
  } catch {
    // If the API is down, still serve the pages we know about.
    return pages;
  }
}
