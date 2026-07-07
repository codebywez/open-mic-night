import type { PerformanceType } from "@/lib/config";
import { PERFORMANCE_TYPES } from "@/lib/config";
import type { EventStatus } from "@/types/database";
import type { Schedule, ScheduledPerformer } from "./timing";

export interface QueueGroups {
  nowPlaying: ScheduledPerformer | null;
  onDeck: ScheduledPerformer | null;
  comingUp: ScheduledPerformer[];
  activeCount: number;
}

/** Splits an ordered schedule into Now Playing / On Deck / Coming Up. */
export function deriveQueueGroups(schedule: Schedule): QueueGroups {
  const active = schedule.items.filter((i) => i.performer.status !== "completed");
  const performing = active.find((i) => i.performer.status === "performing");

  const nowPlaying = performing ?? active[0] ?? null;
  const rest = active.filter((i) => i.performer.id !== nowPlaying?.performer.id);
  const onDeck = rest[0] ?? null;
  const comingUp = rest.slice(1);

  return { nowPlaying, onDeck, comingUp, activeCount: active.length };
}

export function performanceTypeLabel(type: PerformanceType): string {
  return PERFORMANCE_TYPES[type].label;
}

const STATUS_META: Record<
  EventStatus,
  { label: string; tone: "open" | "live" | "closed" | "muted" }
> = {
  draft: { label: "Draft", tone: "muted" },
  open: { label: "Sign-ups Open", tone: "open" },
  live: { label: "Live", tone: "live" },
  finished: { label: "Finished", tone: "closed" },
  expired: { label: "Expired", tone: "muted" },
};

export function eventStatusMeta(status: EventStatus) {
  return STATUS_META[status];
}

/** Whether performers may still join the queue. */
export function signupsOpen(status: EventStatus): boolean {
  return status === "open" || status === "live";
}
