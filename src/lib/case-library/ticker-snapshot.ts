// Last-known-good snapshot of the critical-incident ticker, read on the server.
//
// The homepage used to render fallback copy ("feed temporarily unavailable")
// until a client-side fetch through /api/backend returned, so every first paint
// read as an outage. This module gives the server a ticker to render instead.
//
// `unstable_cache` stores the result in Next's shared data cache with
// stale-while-revalidate semantics: once a read has succeeded, every request is
// served the stored snapshot immediately and a refresh runs in the background.
// A refresh that throws never overwrites the stored entry, so a slow or failing
// API leaves the last successful ticker on screen rather than an empty state.
// Only a deployment that has never had a successful read falls back to copy.

import { unstable_cache } from "next/cache";

const UPSTREAM_API_BASE =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const UPSTREAM_TIMEOUT_MS = 8_000;
export const TICKER_REVALIDATE_SECONDS = 300;

export interface TickerSnapshotItem {
  id: string;
  title: string;
  source: string;
}

export interface TickerSnapshot {
  items: TickerSnapshotItem[];
  /** When the snapshot was confirmed from the SCE API. */
  fetchedAt: string;
}

function parseTickerItems(payload: unknown): TickerSnapshotItem[] {
  if (typeof payload !== "object" || payload === null) return [];
  const raw = (payload as { critical_ticker_items?: unknown }).critical_ticker_items;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const { id, title, source } = entry as Record<string, unknown>;
    if (typeof id !== "string" || typeof title !== "string" || !id || !title) return [];
    return [{ id, title, source: typeof source === "string" && source ? source : "Case Library" }];
  });
}

async function readLiveTicker(): Promise<TickerSnapshot> {
  const base = UPSTREAM_API_BASE.replace(/\/$/, "");
  const response = await fetch(`${base}/advisories/overview`, {
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`advisories/overview returned ${response.status}`);
  }
  const items = parseTickerItems(await response.json());
  // An empty or malformed ticker is treated as a failed read so it cannot
  // replace a good snapshot already in the cache.
  if (items.length === 0) {
    throw new Error("advisories/overview returned no ticker items");
  }
  return { items, fetchedAt: new Date().toISOString() };
}

const readCachedTicker = unstable_cache(readLiveTicker, ["sce-critical-ticker-v1"], {
  revalidate: TICKER_REVALIDATE_SECONDS,
  tags: ["sce-critical-ticker"],
});

/** The last successful ticker, or null if no read has ever succeeded. */
export async function getTickerSnapshot(): Promise<TickerSnapshot | null> {
  try {
    return await readCachedTicker();
  } catch {
    return null;
  }
}
