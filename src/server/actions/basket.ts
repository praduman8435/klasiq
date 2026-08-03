"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getBasketId, getOrCreateBasketId } from "@/lib/basket";
import { isOrderable } from "@/lib/stock";
import {
  clampAddQuantity,
  clampSetQuantity,
  pickDefaultOrderableVariant,
} from "@/lib/basket-math";
import {
  MAX_QUANTITY_PER_LINE,
  addRecommendedSetSchema,
  addToBasketSchema,
  removeBasketItemSchema,
  setBasketItemQuantitySchema,
} from "@/lib/validation/basket";

export type BasketActionResult = {
  success: boolean;
  message?: string;
};

function revalidateBasketViews() {
  // The bag icon/count lives in the root layout, and the bag page shows the
  // full basket — both need to reflect the change immediately.
  revalidatePath("/", "layout");
  revalidatePath("/bag");
}

export async function addToBasket(
  input: unknown,
): Promise<BasketActionResult> {
  const parsed = addToBasketSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid request." };
  }
  const { productVariantId, quantity } = parsed.data;

  // Price and stock are never trusted from the caller — always re-read here.
  const variant = await db.productVariant.findUnique({
    where: { id: productVariantId },
  });
  if (!variant) {
    return { success: false, message: "That item no longer exists." };
  }
  if (!isOrderable(variant.stockStatus)) {
    return { success: false, message: "That size is currently out of stock." };
  }

  const basketId = await getOrCreateBasketId();

  const existing = await db.basketItem.findUnique({
    where: {
      basketId_productVariantId: { basketId, productVariantId },
    },
  });

  const nextQuantity = clampAddQuantity({
    existingQuantity: existing?.quantity ?? 0,
    requestedQuantity: quantity,
    stockQuantity: variant.stockQuantity,
    maxPerLine: MAX_QUANTITY_PER_LINE,
  });

  if (nextQuantity <= (existing?.quantity ?? 0)) {
    return {
      success: false,
      message: `Only ${variant.stockQuantity} left in this size.`,
    };
  }

  if (existing) {
    await db.basketItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await db.basketItem.create({
      data: { basketId, productVariantId, quantity: nextQuantity },
    });
  }

  revalidateBasketViews();
  return { success: true };
}

async function assertOwnedBasketItem(basketItemId: string) {
  const basketId = await getBasketId();
  if (!basketId) return null;

  const item = await db.basketItem.findUnique({ where: { id: basketItemId } });
  if (!item || item.basketId !== basketId) return null;
  return item;
}

export async function setBasketItemQuantity(
  input: unknown,
): Promise<BasketActionResult> {
  const parsed = setBasketItemQuantitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid request." };
  }
  const { basketItemId, quantity } = parsed.data;

  const item = await assertOwnedBasketItem(basketItemId);
  if (!item) {
    return { success: false, message: "That item is not in your bag." };
  }

  if (quantity === 0) {
    await db.basketItem.delete({ where: { id: item.id } });
    revalidateBasketViews();
    return { success: true };
  }

  const variant = await db.productVariant.findUnique({
    where: { id: item.productVariantId },
  });
  if (!variant || !isOrderable(variant.stockStatus)) {
    await db.basketItem.delete({ where: { id: item.id } });
    revalidateBasketViews();
    return { success: false, message: "That size is no longer available and was removed." };
  }

  const clamped = clampSetQuantity({
    requestedQuantity: quantity,
    stockQuantity: variant.stockQuantity,
    maxPerLine: MAX_QUANTITY_PER_LINE,
  });
  await db.basketItem.update({ where: { id: item.id }, data: { quantity: clamped } });

  revalidateBasketViews();
  if (clamped < quantity) {
    return { success: true, message: `Only ${variant.stockQuantity} left — quantity adjusted.` };
  }
  return { success: true };
}

export async function removeBasketItem(
  input: unknown,
): Promise<BasketActionResult> {
  const parsed = removeBasketItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid request." };
  }

  const item = await assertOwnedBasketItem(parsed.data.basketItemId);
  if (!item) {
    return { success: false, message: "That item is not in your bag." };
  }

  await db.basketItem.delete({ where: { id: item.id } });
  revalidateBasketViews();
  return { success: true };
}

export async function addRecommendedSet(
  input: unknown,
): Promise<BasketActionResult> {
  const parsed = addRecommendedSetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid request." };
  }

  const set = await db.recommendedUniformSet.findUnique({
    where: { id: parsed.data.setId },
    include: {
      items: {
        include: { product: { include: { variants: true } } },
      },
    },
  });
  if (!set) {
    return { success: false, message: "That uniform set no longer exists." };
  }

  const basketId = await getOrCreateBasketId();
  const unavailable: string[] = [];

  for (const item of set.items) {
    const defaultVariant = pickDefaultOrderableVariant(item.product.variants);

    if (!defaultVariant) {
      unavailable.push(item.product.name);
      continue;
    }

    const existing = await db.basketItem.findUnique({
      where: {
        basketId_productVariantId: {
          basketId,
          productVariantId: defaultVariant.id,
        },
      },
    });

    const nextQuantity = clampAddQuantity({
      existingQuantity: existing?.quantity ?? 0,
      requestedQuantity: item.quantity,
      stockQuantity: defaultVariant.stockQuantity,
      maxPerLine: MAX_QUANTITY_PER_LINE,
    });

    if (existing) {
      await db.basketItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await db.basketItem.create({
        data: { basketId, productVariantId: defaultVariant.id, quantity: nextQuantity },
      });
    }
  }

  revalidateBasketViews();

  if (unavailable.length > 0) {
    return {
      success: true,
      message: `Added — but ${unavailable.join(", ")} could not be added (out of stock).`,
    };
  }
  return { success: true, message: "Complete set added to your bag." };
}
