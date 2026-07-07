"use client";

import { useCallback, useEffect, useState } from "react";

function storageKey(slug: string): string {
  return `omn:performer:${slug}`;
}

/** Remembers, in localStorage, which performer the current device joined as. */
export function useJoinedPerformer(slug: string) {
  const [performerId, setPerformerId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setPerformerId(localStorage.getItem(storageKey(slug)));
    } catch {
      // ignore (private mode etc.)
    }
    setLoaded(true);
  }, [slug]);

  const join = useCallback(
    (id: string) => {
      try {
        localStorage.setItem(storageKey(slug), id);
      } catch {}
      setPerformerId(id);
    },
    [slug],
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(slug));
    } catch {}
    setPerformerId(null);
  }, [slug]);

  return { performerId, loaded, join, clear };
}
