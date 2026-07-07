"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Music2 } from "lucide-react";
import { formatClockTime } from "@/lib/format";
import { performanceTypeLabel, type QueueGroups } from "@/lib/queue";
import type { ScheduledPerformer } from "@/lib/timing";
import { cn } from "@/lib/utils";

function timeLabel(item: ScheduledPerformer, showTimes: boolean): string | null {
  if (!showTimes || !item.startAt) return null;
  return `~${formatClockTime(item.startAt)}`;
}

function metaLine(item: ScheduledPerformer): string {
  const type = performanceTypeLabel(item.performer.performance_type);
  const songs = item.performer.songs;
  return `${type} · ${songs} ${songs === 1 ? "song" : "songs"}`;
}

export function QueueSpotlight({
  groups,
  showTimes = true,
  variant = "default",
}: {
  groups: QueueGroups;
  showTimes?: boolean;
  variant?: "default" | "display";
}) {
  const { nowPlaying, onDeck, comingUp } = groups;
  const big = variant === "display";

  if (!nowPlaying) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <Music2 className={cn("text-muted-foreground", big ? "size-12" : "size-8")} aria-hidden />
        <p className={cn("font-medium text-muted-foreground", big && "text-2xl")}>
          Waiting for the first performer
        </p>
        <p className={cn("text-sm text-muted-foreground", big && "text-lg")}>
          Scan the QR code to join the queue.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", big && "gap-6")}>
      {/* Now Playing */}
      <div>
        <SectionLabel big={big}>Now Playing</SectionLabel>
        <motion.div
          layout
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-5",
            big && "p-8",
          )}
        >
          <div className="min-w-0">
            <p className={cn("truncate font-bold tracking-tight", big ? "text-5xl" : "text-2xl")}>
              {nowPlaying.performer.display_name}
            </p>
            <p className={cn("mt-1 text-muted-foreground", big ? "text-xl" : "text-sm")}>
              {metaLine(nowPlaying)}
            </p>
          </div>
          <span className="relative flex size-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-primary" />
          </span>
        </motion.div>
      </div>

      {/* Up Next */}
      {onDeck && (
        <div>
          <SectionLabel big={big}>Up Next</SectionLabel>
          <motion.div
            layout
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4",
              big && "p-6",
            )}
          >
            <div className="min-w-0">
              <p className={cn("truncate font-semibold", big ? "text-3xl" : "text-lg")}>
                {onDeck.performer.display_name}
              </p>
              <p className={cn("text-muted-foreground", big ? "text-lg" : "text-sm")}>
                {metaLine(onDeck)}
              </p>
            </div>
            {timeLabel(onDeck, showTimes) && (
              <span className={cn("shrink-0 tabular-nums text-muted-foreground", big && "text-xl")}>
                {timeLabel(onDeck, showTimes)}
              </span>
            )}
          </motion.div>
        </div>
      )}

      {/* Still to Come */}
      {comingUp.length > 0 && (
        <div>
          <SectionLabel big={big}>Still to Come</SectionLabel>
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {comingUp.map((item, index) => (
                <motion.li
                  key={item.performer.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3",
                    big && "px-6 py-4",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
                        big && "size-10 text-base",
                      )}
                    >
                      {index + 2}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("truncate font-medium", big ? "text-2xl" : "text-base")}>
                        {item.performer.display_name}
                      </p>
                      <p className={cn("text-muted-foreground", big ? "text-base" : "text-xs")}>
                        {metaLine(item)}
                      </p>
                    </div>
                  </div>
                  {timeLabel(item, showTimes) && (
                    <span
                      className={cn(
                        "shrink-0 tabular-nums text-muted-foreground",
                        big ? "text-lg" : "text-sm",
                      )}
                    >
                      {timeLabel(item, showTimes)}
                    </span>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children, big }: { children: React.ReactNode; big?: boolean }) {
  return (
    <p
      className={cn(
        "mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        big && "mb-3 text-base",
      )}
    >
      {children}
    </p>
  );
}
