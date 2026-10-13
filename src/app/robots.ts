import type { MetadataRoute } from "next";

import { SITE_URL as SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/orders", "/cart", "/reset-password", "/forgot-password"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
