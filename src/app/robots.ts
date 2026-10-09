import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/orders", "/cart", "/reset-password", "/forgot-password"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
