import { z } from "zod";
import {
  DISPLAY_NAME_MAX,
  EVENT_NAME_MAX,
  MAX_SONGS,
  MIN_SONGS,
  TIMING_DEFAULTS,
} from "@/lib/config";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const songs = z.coerce
  .number()
  .int()
  .min(MIN_SONGS, `Minimum ${MIN_SONGS} song`)
  .max(MAX_SONGS, `Maximum ${MAX_SONGS} songs`);

const positiveMinutes = z.coerce.number().int().min(0).max(120);

export const performanceTypeSchema = z.enum(["solo", "duo", "band"]);

export const setupMinutesSchema = z.object({
  solo: positiveMinutes,
  duo: positiveMinutes,
  band: positiveMinutes,
});

export const createEventSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Event name must be at least 3 characters")
    .max(EVENT_NAME_MAX, `Keep it under ${EVENT_NAME_MAX} characters`),
  slug: optionalString,
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  songs: songs.default(TIMING_DEFAULTS.songs),
  songDurationMinutes: positiveMinutes.default(TIMING_DEFAULTS.songDurationMinutes),
  songChangeMinutes: positiveMinutes.default(TIMING_DEFAULTS.songChangeMinutes),
  setupMinutes: setupMinutesSchema.default({ solo: 2, duo: 3, band: 5 }),
});

export type CreateEventInput = z.input<typeof createEventSchema>;
export type CreateEventValues = z.output<typeof createEventSchema>;

export const updateSettingsSchema = createEventSchema;
export type UpdateSettingsValues = z.output<typeof updateSettingsSchema>;

export const joinQueueSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Please enter a name")
    .max(DISPLAY_NAME_MAX, `Keep it under ${DISPLAY_NAME_MAX} characters`),
  performanceType: performanceTypeSchema.default("solo"),
  songs: songs.default(TIMING_DEFAULTS.songs),
});

export type JoinQueueValues = z.output<typeof joinQueueSchema>;

export const updatePerformerSchema = z.object({
  displayName: z.string().trim().min(1).max(DISPLAY_NAME_MAX).optional(),
  performanceType: performanceTypeSchema.optional(),
  songs: songs.optional(),
  setupOverride: z.coerce.number().int().min(0).max(120).nullable().optional(),
});

export type UpdatePerformerValues = z.output<typeof updatePerformerSchema>;
