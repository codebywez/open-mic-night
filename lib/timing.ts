import type { EventRow, EventSettings, PerformerRow } from "@/types/database";

export interface ScheduledPerformer {
  performer: PerformerRow;
  /** Minutes this performer occupies (setup + songs + song changes). */
  slotMinutes: number;
  /** Estimated time this performer starts. Null for completed performers. */
  startAt: Date | null;
  /** Estimated time this performer finishes. Null for completed performers. */
  endAt: Date | null;
}

export interface Schedule {
  items: ScheduledPerformer[];
  /** Estimated time the last active performer finishes, or null if the queue is empty. */
  estimatedFinish: Date | null;
  /** Scheduled end of the event, if configured. */
  scheduledEnd: Date | null;
  /** True when the estimated finish runs past the scheduled end. */
  isOverrunning: boolean;
  /** Whole "average" performers that still fit before the scheduled end (>= 0). */
  capacityRemaining: number | null;
  /** Number of performers not yet completed. */
  activeCount: number;
}

/** Minutes an average performer takes, using event defaults (for capacity math). */
export function averageSlotMinutes(settings: EventSettings): number {
  const { songs, songDurationMinutes, songChangeMinutes, setupMinutes } = settings;
  const avgSetup = (setupMinutes.solo + setupMinutes.duo + setupMinutes.band) / 3;
  return avgSetup + songs * songDurationMinutes + Math.max(0, songs - 1) * songChangeMinutes;
}

/** Minutes a specific performer occupies. */
export function performerSlotMinutes(performer: PerformerRow, settings: EventSettings): number {
  const setup = performer.setup_override ?? settings.setupMinutes[performer.performance_type] ?? 0;
  const perform =
    performer.songs * settings.songDurationMinutes +
    Math.max(0, performer.songs - 1) * settings.songChangeMinutes;
  return setup + perform;
}

function combineDateTime(date: string | null, time: string | null): Date | null {
  if (!date) return null;
  const t = time ?? "00:00:00";
  const parsed = new Date(`${date}T${t}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

/**
 * Builds the estimated running order. Completed performers are excluded from
 * future timing; the anchor is "now" once the event is live or someone is
 * performing, otherwise the scheduled start (or now if that has passed).
 */
export function buildSchedule(
  event: Pick<EventRow, "event_date" | "start_time" | "end_time" | "status" | "settings">,
  performers: PerformerRow[],
  now: Date = new Date(),
): Schedule {
  const settings = event.settings;
  const scheduledStart = combineDateTime(event.event_date, event.start_time);
  const scheduledEnd = combineDateTime(event.event_date, event.end_time);

  const ordered = [...performers].sort((a, b) => a.queue_position - b.queue_position);
  const active = ordered.filter((p) => p.status !== "completed");
  const someonePerforming = active.some((p) => p.status === "performing");

  const running = event.status === "live" || someonePerforming;
  let cursor = running || !scheduledStart ? now : scheduledStart > now ? scheduledStart : now;

  const items: ScheduledPerformer[] = ordered.map((performer) => {
    const slotMinutes = performerSlotMinutes(performer, settings);
    if (performer.status === "completed") {
      return { performer, slotMinutes, startAt: null, endAt: null };
    }
    const startAt = cursor;
    const endAt = addMinutes(cursor, slotMinutes);
    cursor = endAt;
    return { performer, slotMinutes, startAt, endAt };
  });

  const lastActive = [...items].reverse().find((i) => i.endAt !== null);
  const estimatedFinish = lastActive?.endAt ?? null;

  let capacityRemaining: number | null = null;
  let isOverrunning = false;
  if (scheduledEnd) {
    isOverrunning = estimatedFinish !== null && estimatedFinish > scheduledEnd;
    const minutesLeft = (scheduledEnd.getTime() - cursor.getTime()) / 60_000;
    const avg = averageSlotMinutes(settings);
    capacityRemaining = avg > 0 ? Math.max(0, Math.floor(minutesLeft / avg)) : 0;
  }

  return {
    items,
    estimatedFinish,
    scheduledEnd,
    isOverrunning,
    capacityRemaining,
    activeCount: active.length,
  };
}
