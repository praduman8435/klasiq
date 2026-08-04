import type { FulfillmentType, OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";

export type AdminOrderFilters = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentType?: FulfillmentType;
  query?: string;
};

// A small shop doesn't need pagination UI yet — capping the list keeps the
// page fast and avoids ever silently rendering an unbounded table.
const ADMIN_ORDER_LIST_LIMIT = 200;

export async function getAdminOrders(filters: AdminOrderFilters) {
  const trimmedQuery = filters.query?.trim();

  return db.order.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
      ...(filters.fulfillmentType ? { fulfillmentType: filters.fulfillmentType } : {}),
      ...(trimmedQuery
        ? {
            OR: [
              { orderNumber: { contains: trimmedQuery, mode: "insensitive" as const } },
              { customerName: { contains: trimmedQuery, mode: "insensitive" as const } },
              { customerMobile: { contains: trimmedQuery } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: ADMIN_ORDER_LIST_LIMIT,
  });
}

export async function getAdminOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: {
      items: { orderBy: { id: "asc" } },
      school: { select: { name: true } },
      inventoryAdjustments: { orderBy: { createdAt: "desc" } },
    },
  });
}
