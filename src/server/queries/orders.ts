import { db } from "@/lib/db";

/**
 * Looks up an order for the public confirmation page. Both orderNumber
 * AND accessToken must match — the order number alone is guessable
 * (sequential-looking, human-readable) and must never be sufficient to
 * view someone else's name/mobile/address. See "Order lookup security" in
 * docs/PHASE_2_REPORT.md.
 */
export async function getOrderByNumberAndToken(orderNumber: string, accessToken: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: { orderBy: { id: "asc" } },
    },
  });

  if (!order || order.accessToken !== accessToken) return null;
  return order;
}
