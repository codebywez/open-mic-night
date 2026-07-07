"use server";

import { revalidatePath } from "next/cache";
import { CLEANUP_AFTER_HOURS } from "@/lib/config";
import { isSlugTaken } from "@/lib/data";
import { createEventSchema, type UpdateSettingsValues, updateSettingsSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  generateHostToken,
  generateSlug,
  hashToken,
  normalizeSlug,
  suggestSlugs,
} from "@/lib/tokens";
import type { EventSettings } from "@/types/database";

export type CreateEventResult =
  | {
      ok: true;
      slug: string;
      token: string;
    }
  | {
      ok: false;
      error: string;
      suggestions?: string[];
      field?: "slug" | "name";
    };

function toSettings(values: {
  songs: number;
  songDurationMinutes: number;
  songChangeMinutes: number;
  setupMinutes: EventSettings["setupMinutes"];
}): EventSettings {
  return {
    songs: values.songs,
    songDurationMinutes: values.songDurationMinutes,
    songChangeMinutes: values.songChangeMinutes,
    setupMinutes: values.setupMinutes,
  };
}

/** Computes when the event and all its data should be deleted. */
function computeExpiry(date?: string, endTime?: string): string {
  const fallback = new Date(Date.now() + 18 * 60 * 60 * 1000);
  if (!date) return fallback.toISOString();
  const end = new Date(`${date}T${endTime ?? "23:59:00"}`);
  if (Number.isNaN(end.getTime())) return fallback.toISOString();
  const withGrace = new Date(end.getTime() + CLEANUP_AFTER_HOURS * 60 * 60 * 1000);
  // Never expire sooner than a few hours from now, even for past-dated events.
  const minimum = new Date(Date.now() + 6 * 60 * 60 * 1000);
  return (withGrace > minimum ? withGrace : minimum).toISOString();
}

async function resolveUniqueSlug(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = generateSlug();
    if (!(await isSlugTaken(candidate))) return candidate;
  }
  // Extremely unlikely; fall back to a longer random slug.
  return `${generateSlug()}${generateSlug().slice(0, 3)}`;
}

export async function createEvent(input: unknown): Promise<CreateEventResult> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const values = parsed.data;

  let slug: string;
  if (values.slug) {
    const normalized = normalizeSlug(values.slug);
    if (!normalized.ok) {
      return { ok: false, error: normalized.reason, field: "slug" };
    }
    if (await isSlugTaken(normalized.slug)) {
      return {
        ok: false,
        error: "That web address is already in use.",
        field: "slug",
        suggestions: suggestSlugs(normalized.slug),
      };
    }
    slug = normalized.slug;
  } else {
    slug = await resolveUniqueSlug();
  }

  const token = generateHostToken();
  const supabase = getSupabaseAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: values.name,
      slug,
      event_date: values.date ?? null,
      start_time: values.startTime ?? null,
      end_time: values.endTime ?? null,
      status: "open",
      settings: toSettings(values),
      expires_at: computeExpiry(values.date, values.endTime),
    })
    .select("id")
    .single();

  if (error || !event) {
    // Unique violation on slug (race) → let the user retry.
    if (error?.code === "23505") {
      return { ok: false, error: "That web address was just taken. Try another.", field: "slug" };
    }
    return { ok: false, error: "Could not create the event. Please try again." };
  }

  const { error: secretError } = await supabase.from("event_secrets").insert({
    event_id: event.id,
    token_hash: hashToken(token),
  });

  if (secretError) {
    // Roll back the event so we never have an unmanageable event.
    await supabase.from("events").delete().eq("id", event.id);
    return { ok: false, error: "Could not create the event. Please try again." };
  }

  return { ok: true, slug, token };
}

export type CheckSlugResult = { available: boolean; reason?: string; suggestions?: string[] };

export async function checkSlugAvailability(rawSlug: string): Promise<CheckSlugResult> {
  const normalized = normalizeSlug(rawSlug);
  if (!normalized.ok) return { available: false, reason: normalized.reason };
  if (await isSlugTaken(normalized.slug)) {
    return {
      available: false,
      reason: "Already in use.",
      suggestions: suggestSlugs(normalized.slug),
    };
  }
  return { available: true };
}

export type UpdateSettingsResult = { ok: true } | { ok: false; error: string };

/** Updates an event's settings/details. Requires a valid host token. */
export async function updateEventSettings(
  slug: string,
  token: string,
  input: UpdateSettingsValues,
): Promise<UpdateSettingsResult> {
  const { verifyHostToken } = await import("./host");
  const auth = await verifyHostToken(slug, token);
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = updateSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const values = parsed.data;
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("events")
    .update({
      name: values.name,
      event_date: values.date ?? null,
      start_time: values.startTime ?? null,
      end_time: values.endTime ?? null,
      // Preserve the sign-ups flag, which is managed separately from this form.
      settings: { ...toSettings(values), signupsClosed: auth.event.settings.signupsClosed },
    })
    .eq("id", auth.eventId);

  if (error) return { ok: false, error: "Could not save settings." };

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/manage/${token}`);
  return { ok: true };
}
