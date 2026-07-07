"use server";

import { revalidatePath } from "next/cache";
import { signupsOpen } from "@/lib/queue";
import { type JoinQueueValues, joinQueueSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type JoinQueueResult =
  | { ok: true; performerId: string; position: number }
  | { ok: false; error: string };

/** Public action: a performer joins the queue. No host token required. */
export async function joinQueue(slug: string, input: JoinQueueValues): Promise<JoinQueueResult> {
  const parsed = joinQueueSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const values = parsed.data;

  const supabase = getSupabaseAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, status, settings")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) return { ok: false, error: "Event not found." };
  if (!signupsOpen(event.status, event.settings.signupsClosed)) {
    return { ok: false, error: "Sign-ups are closed." };
  }

  const { data: last } = await supabase
    .from("performers")
    .select("queue_position")
    .eq("event_id", event.id)
    .order("queue_position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.queue_position ?? 0) + 1;

  const { data, error } = await supabase
    .from("performers")
    .insert({
      event_id: event.id,
      display_name: values.displayName,
      performance_type: values.performanceType,
      songs: values.songs,
      status: "queued",
      queue_position: position,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Could not join the queue. Please try again." };

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/display`);
  return { ok: true, performerId: data.id, position };
}

/** Public action: a performer leaves the queue (self-service). */
export async function leaveQueue(slug: string, performerId: string): Promise<JoinQueueResult> {
  const supabase = getSupabaseAdminClient();
  const { data: event } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
  if (!event) return { ok: false, error: "Event not found." };

  const { error } = await supabase
    .from("performers")
    .delete()
    .eq("id", performerId)
    .eq("event_id", event.id)
    .neq("status", "performing");
  if (error) return { ok: false, error: "Could not leave the queue." };
  revalidatePath(`/${slug}`);
  return { ok: true, performerId, position: 0 };
}
