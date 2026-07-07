"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { EventRow, PerformerRow } from "@/types/database";

function sortByPosition(rows: PerformerRow[]): PerformerRow[] {
  return [...rows].sort((a, b) => a.queue_position - b.queue_position);
}

function applyChange(
  current: PerformerRow[],
  payload: RealtimePostgresChangesPayload<PerformerRow>,
): PerformerRow[] {
  if (payload.eventType === "INSERT") {
    const row = payload.new;
    if (current.some((p) => p.id === row.id)) return current;
    return sortByPosition([...current, row]);
  }
  if (payload.eventType === "UPDATE") {
    const row = payload.new;
    return sortByPosition(current.map((p) => (p.id === row.id ? row : p)));
  }
  if (payload.eventType === "DELETE") {
    const oldId = (payload.old as Partial<PerformerRow>).id;
    return current.filter((p) => p.id !== oldId);
  }
  return current;
}

export interface LiveEvent {
  event: EventRow;
  performers: PerformerRow[];
  /** Ticks periodically so time estimates stay fresh. */
  now: Date;
  connected: boolean;
}

/**
 * Keeps event + performers in sync with Supabase Realtime, starting from
 * server-rendered initial data. Also exposes a periodically-updated `now`.
 */
export function useLiveEvent(initialEvent: EventRow, initialPerformers: PerformerRow[]): LiveEvent {
  const [event, setEvent] = useState(initialEvent);
  const [performers, setPerformers] = useState(() => sortByPosition(initialPerformers));
  const [now, setNow] = useState(() => new Date());
  const [connected, setConnected] = useState(false);

  const eventId = initialEvent.id;

  // Keep server-driven prop updates (e.g. after router.refresh) in sync.
  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);
  useEffect(() => {
    setPerformers(sortByPosition(initialPerformers));
  }, [initialPerformers]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "performers", filter: `event_id=eq.${eventId}` },
        (payload: RealtimePostgresChangesPayload<PerformerRow>) => {
          setPerformers((prev) => applyChange(prev, payload));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${eventId}` },
        (payload: RealtimePostgresChangesPayload<EventRow>) => {
          setEvent(payload.new as EventRow);
        },
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return useMemo(
    () => ({ event, performers, now, connected }),
    [event, performers, now, connected],
  );
}
