import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow, PerformerRow } from "@/types/database";

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPerformers(eventId: string): Promise<PerformerRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("performers")
    .select("*")
    .eq("event_id", eventId)
    .order("queue_position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getEventWithPerformers(
  slug: string,
): Promise<{ event: EventRow; performers: PerformerRow[] } | null> {
  const event = await getEventBySlug(slug);
  if (!event) return null;
  const performers = await getPerformers(event.id);
  return { event, performers };
}

/** Checks whether a slug is already used. Uses admin client to avoid RLS edge cases. */
export async function isSlugTaken(slug: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data !== null;
}
