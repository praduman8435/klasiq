import type { Prisma } from "@prisma/client";

export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

export type RecommendedSetWithItems = Prisma.RecommendedUniformSetGetPayload<{
  include: {
    items: {
      include: { product: { include: { variants: true } } };
    };
  };
}>;
