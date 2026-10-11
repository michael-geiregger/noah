"use client";

import { useCallback, useEffect, useState } from "react";

/** Lädt Daten asynchron und liefert {data, loading, error, reload}. */
export function useData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function averageStars(ratings: { product_id: string; stars: number }[], productId: string) {
  const mine = ratings.filter((r) => r.product_id === productId);
  if (!mine.length) return { avg: 0, count: 0 };
  return { avg: mine.reduce((s, r) => s + r.stars, 0) / mine.length, count: mine.length };
}

export function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export function formatPrice(price: number, lang: string) {
  const locale = lang === "ja" ? "ja-JP" : lang === "en" ? "en-GB" : "de-DE";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(price);
}
