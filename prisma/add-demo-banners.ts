/**
 * Adds three starter homepage banners (skips any whose title already
 * exists, so it is safe to run twice). Every line is a true store fact —
 * no invented sale. Edit, hide or delete them any time in /admin/banners.
 *
 *   npx tsx prisma/add-demo-banners.ts
 *
 * The free-delivery amount is written from FULFILLMENT_CONFIG at the time
 * this runs; if the threshold changes later, edit that banner too.
 */
import { PrismaClient, type PromoBannerIcon, type PromoBannerTone } from "@prisma/client";
import { FULFILLMENT_CONFIG } from "../src/lib/fulfillment-config";
import { formatPaise } from "../src/lib/money";

const db = new PrismaClient();

async function main() {
  const categories = await db.category.findMany({ select: { slug: true } });
  const slugs = new Set(categories.map((c) => c.slug));
  const familySlug = ["kurtis", "jeans", "shirts"].find((slug) => slugs.has(slug));
  const uniformSlug = ["uniforms", "school-uniforms"].find((slug) => slugs.has(slug));

  const banners: {
    title: string;
    body: string;
    ctaLabel: string | null;
    ctaHref: string | null;
    tone: PromoBannerTone;
    icon: PromoBannerIcon;
  }[] = [
    {
      title: "School uniforms for every class",
      body: "Choose your school and class to see the exact uniform, in every size.",
      ctaLabel: "Find your school",
      ctaHref: "/schools",
      tone: "RED",
      icon: "SCHOOL",
    },
    {
      title: `Free delivery above ${formatPaise(FULFILLMENT_CONFIG.freeDeliveryThresholdInPaise)}`,
      body: "Or pick up from our shop. Pay cash when you get your order.",
      ctaLabel: uniformSlug ? "Shop uniforms" : null,
      ctaHref: uniformSlug ? `/${uniformSlug}` : null,
      tone: "INK",
      icon: "DELIVERY",
    },
    // Only when the shop really sells family wear beyond school kit.
    ...(familySlug
      ? [
          {
            title: "Kapde poore parivaar ke",
            body: "Clothes, shoes and bags for everyone at home, in one shop.",
            ctaLabel: "Start shopping",
            ctaHref: `/${familySlug}`,
            tone: "SOFT" as const,
            icon: "FESTIVAL" as const,
          },
        ]
      : []),
  ];

  const last = await db.promoBanner.aggregate({ _max: { sortOrder: true } });
  let sortOrder = (last._max.sortOrder ?? -1) + 1;
  for (const banner of banners) {
    const exists = await db.promoBanner.findFirst({ where: { title: banner.title } });
    if (exists) {
      console.log(`skip (already there): ${banner.title}`);
      continue;
    }
    await db.promoBanner.create({ data: { ...banner, isActive: true, sortOrder: sortOrder++ } });
    console.log(`added: ${banner.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
