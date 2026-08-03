import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const BASKET_COOKIE_NAME = "shop_basket_id";
const BASKET_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

/** Read-only basket id lookup — safe to call from Server Components. */
export async function getBasketId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(BASKET_COOKIE_NAME)?.value ?? null;
}

/**
 * Gets the current basket id, creating a new Basket row and setting the
 * cookie if none exists yet. Only callable from a Server Action or Route
 * Handler (cookie writes are not allowed during Server Component render).
 */
export async function getOrCreateBasketId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(BASKET_COOKIE_NAME)?.value;
  if (existing) {
    const basket = await db.basket.findUnique({ where: { id: existing } });
    if (basket) return basket.id;
  }

  const basket = await db.basket.create({ data: {} });
  cookieStore.set(BASKET_COOKIE_NAME, basket.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: BASKET_COOKIE_MAX_AGE_SECONDS,
  });
  return basket.id;
}

/**
 * The full basket with everything needed to render it, re-read fresh from
 * the database on every call — quantity, price and stock displayed to the
 * parent are never cached client state.
 */
export async function getBasket() {
  const basketId = await getBasketId();
  if (!basketId) return null;

  const basket = await db.basket.findUnique({
    where: { id: basketId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          productVariant: {
            include: {
              product: {
                include: { category: { select: { slug: true } } },
              },
            },
          },
        },
      },
    },
  });

  return basket;
}

export function basketItemCount(
  basket: Awaited<ReturnType<typeof getBasket>>,
): number {
  if (!basket) return 0;
  return basket.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function basketTotalInPaise(
  basket: Awaited<ReturnType<typeof getBasket>>,
): number {
  if (!basket) return 0;
  return basket.items.reduce(
    (sum, item) => sum + item.productVariant.priceInPaise * item.quantity,
    0,
  );
}
