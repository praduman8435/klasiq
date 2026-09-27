-- CreateEnum
CREATE TYPE "PromoBannerTone" AS ENUM ('RED', 'INK', 'SOFT');

-- CreateEnum
CREATE TYPE "PromoBannerIcon" AS ENUM ('DELIVERY', 'PICKUP', 'PAYMENT', 'OFFER', 'FESTIVAL', 'SCHOOL');

-- CreateTable
CREATE TABLE "promo_banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "tone" "PromoBannerTone" NOT NULL DEFAULT 'RED',
    "icon" "PromoBannerIcon" NOT NULL DEFAULT 'OFFER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promo_banners_isActive_sortOrder_idx" ON "promo_banners"("isActive", "sortOrder");

-- Row Level Security: the app connects as the table owner, which RLS
-- does not restrict; this closes the table to Supabase's anon/authenticated
-- API roles, like every other table.
ALTER TABLE "promo_banners" ENABLE ROW LEVEL SECURITY;
