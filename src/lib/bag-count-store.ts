"use client";

import { useSyncExternalStore } from "react";

/**
 * The bag badge's number, loaded in the browser from /api/bag/count rather
 * than rendered into the page — that's what lets every storefront page be
 * served straight from the CDN. Anything that changes the bag calls
 * `refreshBagCount()` after it succeeds; coming back to the tab refreshes
 * it too (another tab may have changed the bag).
 */

let count = 0;
let started = false;
let latestRequest = 0;
const listeners = new Set<() => void>();

function emit(next: number) {
  if (next === count) return;
  count = next;
  for (const listener of listeners) listener();
}

export async function refreshBagCount(): Promise<void> {
  const request = ++latestRequest;
  try {
    const res = await fetch("/api/bag/count", { cache: "no-store", credentials: "same-origin" });
    if (!res.ok) return;
    const data = (await res.json()) as { count?: unknown };
    // Only the newest request wins, so an older, slower answer can't
    // overwrite a fresher one.
    if (request === latestRequest && typeof data.count === "number") emit(data.count);
  } catch {
    // Offline or blocked: keep showing the last known number.
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void refreshBagCount();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshBagCount();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void refreshBagCount();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

export function useBagCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => count,
    () => 0,
  );
}
