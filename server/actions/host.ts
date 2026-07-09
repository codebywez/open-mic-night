"use server";

import { revalidatePath } from "next/cache";
import { type UpdatePerformerValues, updatePerformerSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/tokens";
import type { EventRow, EventStatus, PerformerRow } from "@/types/database";

type HostAuth = { ok: true; eventId: string; event: EventRow } | { ok: false; error: string };

/** Verifies a host token against the stored hash for a slug. */
export async function verifyHostToken(slug: string, token: string): Promise<HostAuth> {
  const supabase = getSupabaseAdminClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !event) return { ok: false, error: "Event not found." };

  const { data: secret } = await supabase
    .from("event_secrets")
    .select("token_hash")
    .eq("event_id", event.id)
    .maybeSingle();

  if (!secret || !verifyToken(token, secret.token_hash)) {
    return { ok: false, error: "Invalid host link." };
  }
  return { ok: true, eventId: event.id, event };
}

type ActionResult<T = Record<never, never>> = ({ ok: true } & T) | { ok: false; error: string };

function revalidateHost(slug: string, token: string) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/display`);
  revalidatePath(`/${slug}/manage/${token}`);
}

async function nextQueuePosition(eventId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("performers")
    .select("queue_position")
    .eq("event_id", eventId)
    .order("queue_position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.queue_position ?? 0) + 1;
}

export async function addPerformer(
  slug: string,
  token: string,
  values: UpdatePerformerValues & { displayName: string; performanceType: "solo" | "duo" | "band" },
): Promise<ActionResult<{ performerId: string }>> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = updatePerformerSchema.safeParse(values);
  if (!parsed.success || !values.displayName) {
    return { ok: false, error: "Please enter a name." };
  }

  const supabase = getSupabaseAdminClient();
  const position = await nextQueuePosition(auth.eventId);
  const { data, error } = await supabase
    .from("performers")
    .insert({
      event_id: auth.eventId,
      display_name: values.displayName,
      performance_type: values.performanceType,
      songs: values.songs ?? auth.event.settings.songs,
      setup_override: values.setupOverride ?? null,
      status: "queued",
      queue_position: position,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Could not add performer." };
  revalidateHost(slug, token);
  return { ok: true, performerId: data.id };
}

export async function updatePerformer(
  slug: string,
  token: string,
  performerId: string,
  values: UpdatePerformerValues,
): Promise<ActionResult> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = updatePerformerSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Invalid values." };
  const v = parsed.data;

  const patch: Partial<PerformerRow> = {};
  if (v.displayName !== undefined) patch.display_name = v.displayName;
  if (v.performanceType !== undefined) patch.performance_type = v.performanceType;
  if (v.songs !== undefined) patch.songs = v.songs;
  if (v.setupOverride !== undefined) patch.setup_override = v.setupOverride;
  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("performers")
    .update(patch)
    .eq("id", performerId)
    .eq("event_id", auth.eventId);
  if (error) return { ok: false, error: "Could not update performer." };
  revalidateHost(slug, token);
  return { ok: true };
}

export async function removePerformer(
  slug: string,
  token: string,
  performerId: string,
): Promise<ActionResult> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("performers")
    .delete()
    .eq("id", performerId)
    .eq("event_id", auth.eventId);
  if (error) return { ok: false, error: "Could not remove performer." };
  revalidateHost(slug, token);
  return { ok: true };
}

export type PerformerAction = "start" | "complete" | "reset";

export async function setPerformerStatus(
  slug: string,
  token: string,
  performerId: string,
  action: PerformerAction,
): Promise<ActionResult> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = getSupabaseAdminClient();

  if (action === "start") {
    // Only one performer performs at a time; demote any current performer.
    await supabase
      .from("performers")
      .update({ status: "queued" })
      .eq("event_id", auth.eventId)
      .eq("status", "performing");
    const { error } = await supabase
      .from("performers")
      .update({ status: "performing" })
      .eq("id", performerId)
      .eq("event_id", auth.eventId);
    if (error) return { ok: false, error: "Could not start performer." };
    // Record the set start time (for the countdown) and go live if needed.
    const eventUpdate: Partial<EventRow> = {
      settings: { ...auth.event.settings, performingStartedAt: new Date().toISOString() },
    };
    if (auth.event.status === "open") eventUpdate.status = "live";
    await supabase.from("events").update(eventUpdate).eq("id", auth.eventId);
  } else {
    const status = action === "complete" ? "completed" : "queued";
    const { error } = await supabase
      .from("performers")
      .update({ status })
      .eq("id", performerId)
      .eq("event_id", auth.eventId);
    if (error) return { ok: false, error: "Could not update performer." };
  }

  revalidateHost(slug, token);
  return { ok: true };
}

export async function reorderPerformers(
  slug: string,
  token: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };

  const supabase = getSupabaseAdminClient();
  // Positions are 1-based in queue order. Update sequentially.
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("performers")
      .update({ queue_position: index + 1 })
      .eq("id", id)
      .eq("event_id", auth.eventId),
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) return { ok: false, error: "Could not reorder the queue." };
  revalidateHost(slug, token);
  return { ok: true };
}

export async function setSignupsClosed(
  slug: string,
  token: string,
  closed: boolean,
): Promise<ActionResult> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("events")
    .update({ settings: { ...auth.event.settings, signupsClosed: closed } })
    .eq("id", auth.eventId);
  if (error) return { ok: false, error: "Could not update sign-ups." };
  revalidateHost(slug, token);
  return { ok: true };
}

export async function setEventStatus(
  slug: string,
  token: string,
  status: EventStatus,
): Promise<ActionResult> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("events").update({ status }).eq("id", auth.eventId);
  if (error) return { ok: false, error: "Could not update the event." };
  revalidateHost(slug, token);
  return { ok: true };
}

export async function deleteEvent(slug: string, token: string): Promise<ActionResult> {
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };
  const supabase = getSupabaseAdminClient();
  // Cascades to performers + event_secrets.
  const { error } = await supabase.from("events").delete().eq("id", auth.eventId);
  if (error) return { ok: false, error: "Could not delete the event." };
  return { ok: true };
}
