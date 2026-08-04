"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
} from "@/lib/validation/admin-orders";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-lifecycle";

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        placeholder="Search order #, name or mobile"
        defaultValue={searchParams.get("q") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateParam("q", e.currentTarget.value);
        }}
        onBlur={(e) => updateParam("q", e.currentTarget.value)}
        className="sm:max-w-xs"
      />

      <select
        aria-label="Filter by order status"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-9 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">All statuses</option>
        {ORDER_STATUS_VALUES.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by payment status"
        value={searchParams.get("paymentStatus") ?? ""}
        onChange={(e) => updateParam("paymentStatus", e.target.value)}
        className="h-9 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">All payment statuses</option>
        {PAYMENT_STATUS_VALUES.map((status) => (
          <option key={status} value={status}>
            {PAYMENT_STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by fulfillment method"
        value={searchParams.get("fulfillmentType") ?? ""}
        onChange={(e) => updateParam("fulfillmentType", e.target.value)}
        className="h-9 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">All fulfillment methods</option>
        <option value="STORE_PICKUP">Store Pickup</option>
        <option value="LOCAL_DELIVERY">Local Delivery</option>
      </select>
    </div>
  );
}
