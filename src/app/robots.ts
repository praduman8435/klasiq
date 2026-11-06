import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/bag", "/checkout", "/api/", "/admin", "/track", "/order/", "/bill/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
