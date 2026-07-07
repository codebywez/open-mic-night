"use client";

import { CalendarDays, Clock, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useJoinedPerformer } from "@/hooks/use-joined-performer";
import { useLiveEvent } from "@/hooks/use-live-event";
import { formatEventDate, formatTimeString } from "@/lib/format";
import { deriveQueueGroups, signupsOpen } from "@/lib/queue";
import { buildSchedule } from "@/lib/timing";
import type { EventRow, PerformerRow } from "@/types/database";
import { JoinQueueSheet } from "./join-queue-sheet";
import { QueueSpotlight } from "./queue-spotlight";
import { YourPosition } from "./your-position";

export function PublicEvent({
  initialEvent,
  initialPerformers,
}: {
  initialEvent: EventRow;
  initialPerformers: PerformerRow[];
}) {
  const { event, performers, now } = useLiveEvent(initialEvent, initialPerformers);
  const { performerId, loaded, join, clear } = useJoinedPerformer(event.slug);
  const [joinOpen, setJoinOpen] = useState(false);

  const { schedule, groups } = useMemo(() => {
    const s = buildSchedule(event, performers, now);
    return { schedule: s, groups: deriveQueueGroups(s) };
  }, [event, performers, now]);

  const open = signupsOpen(event.status, event.settings.signupsClosed);
  const dateLabel = formatEventDate(event.event_date);
  const startLabel = formatTimeString(event.start_time);
  const finishLabel = formatTimeString(event.end_time);
  const isJoined = loaded && performerId && performers.some((p) => p.id === performerId);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-28">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{event.name}</h1>
              <StatusBadge status={event.status} signupsClosed={event.settings.signupsClosed} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {dateLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden />
                  {dateLabel}
                </span>
              )}
              {(startLabel || finishLabel) && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden />
                  {startLabel ?? "—"}
                  {finishLabel ? ` – ${finishLabel}` : ""}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" aria-hidden />
                {groups.activeCount} in queue
              </span>
            </div>
            {schedule.isOverrunning && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                Running over the scheduled finish. The host may trim sets to catch up.
              </p>
            )}
          </section>

          {isJoined && performerId ? (
            <YourPosition
              event={event}
              performers={performers}
              now={now}
              performerId={performerId}
              onLeave={clear}
            />
          ) : (
            open && (
              <Button size="lg" className="h-14 w-full text-base" onClick={() => setJoinOpen(true)}>
                Join Queue
              </Button>
            )
          )}

          {!open && !isJoined && (
            <p className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              {event.status === "finished" || event.status === "expired"
                ? "This event has finished."
                : "Sign-ups are currently closed."}
            </p>
          )}

          <QueueSpotlight groups={groups} showTimes />

          {schedule.estimatedFinish && groups.activeCount > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Estimated finish around{" "}
              {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
                schedule.estimatedFinish,
              )}
              {schedule.capacityRemaining !== null &&
                ` · room for about ${schedule.capacityRemaining} more`}
            </p>
          )}
        </div>
      </main>

      <JoinQueueSheet
        slug={event.slug}
        defaultSongs={event.settings.songs}
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onJoined={join}
      />
    </>
  );
}
