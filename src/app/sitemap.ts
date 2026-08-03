import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { NAV_CATEGORIES } from "@/server/queries/categories";

const SITE_URL = "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const schools = await db.school.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...NAV_CATEGORIES.map((category) => ({
      url: `${SITE_URL}/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const schoolRoutes: MetadataRoute.Sitemap = schools.map((school) => ({
    url: `${SITE_URL}/school/${school.slug}`,
    lastModified: school.updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...schoolRoutes];
}
