export const APP_NAME = "Open Mic Night";
export const APP_DESCRIPTION =
  "Create and manage an open mic queue in under 30 seconds. Free, no accounts, works on any device.";

/**
 * Canonical, public-facing base URL. Used for building shareable links and QR codes.
 * Falls back to the current origin in the browser when unset.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://openmicnight.co.uk").replace(
  /\/$/,
  "",
);

/** How long after an event finishes before all its data is deleted. */
export const CLEANUP_AFTER_HOURS = 6;

/** Routes that may never be used as an event slug. */
export const RESERVED_SLUGS = [
  "create",
  "api",
  "manage",
  "display",
  "settings",
  "admin",
  "_next",
  "favicon.ico",
  "manifest.webmanifest",
  "sw.js",
  "offline",
  "icons",
  "privacy",
] as const;

/** Performance types and their default setup allowance (minutes). */
export const PERFORMANCE_TYPES = {
  solo: { label: "Solo", setupMinutes: 2 },
  duo: { label: "Duo", setupMinutes: 3 },
  band: { label: "Band", setupMinutes: 5 },
} as const;

export type PerformanceType = keyof typeof PERFORMANCE_TYPES;

/** Default timing values applied to a new event. */
export const TIMING_DEFAULTS = {
  songs: 3,
  songDurationMinutes: 4,
  songChangeMinutes: 1,
} as const;

export const MIN_SONGS = 1;
export const MAX_SONGS = 10;

/** Bounds for a display name entered by a performer. */
export const DISPLAY_NAME_MAX = 40;
export const EVENT_NAME_MAX = 80;

export function buildEventUrl(slug: string): string {
  return `${SITE_URL}/${slug}`;
}

export function buildDisplayUrl(slug: string): string {
  return `${SITE_URL}/${slug}/display`;
}

export function buildManageUrl(slug: string, token: string): string {
  return `${SITE_URL}/${slug}/manage/${token}`;
}
