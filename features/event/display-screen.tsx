"use client";

import { Maximize, Minimize, ScanLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QrCode } from "@/components/qr-code";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useLiveEvent } from "@/hooks/use-live-event";
import { APP_NAME, buildEventUrl } from "@/lib/config";
import { deriveQueueGroups } from "@/lib/queue";
import { buildSchedule } from "@/lib/timing";
import type { EventRow, PerformerRow } from "@/types/database";
import { QueueSpotlight } from "./queue-spotlight";

export function DisplayScreen({
  initialEvent,
  initialPerformers,
}: {
  initialEvent: EventRow;
  initialPerformers: PerformerRow[];
}) {
  const { event, performers, now } = useLiveEvent(initialEvent, initialPerformers);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const publicUrl = buildEventUrl(event.slug);
  const groups = useMemo(
    () => deriveQueueGroups(buildSchedule(event, performers, now)),
    [event, performers, now],
  );

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background p-6 lg:p-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight lg:text-4xl">{event.name}</h1>
          <StatusBadge
            status={event.status}
            signupsClosed={event.settings.signupsClosed}
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-lg text-muted-foreground sm:inline">{APP_NAME}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="size-5" aria-hidden />
            ) : (
              <Maximize className="size-5" aria-hidden />
            )}
          </Button>
        </div>
      </header>

      <div className="grid flex-1 gap-8 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <QueueSpotlight groups={groups} showTimes variant="display" />
        </div>

        <aside className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8 lg:w-80">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <ScanLine className="size-6 text-primary" aria-hidden />
            Join the queue
          </div>
          <QrCode value={publicUrl} size={260} className="p-4" />
          <p className="text-center text-lg font-medium text-muted-foreground">
            {publicUrl.replace(/^https?:\/\//, "")}
          </p>
        </aside>
      </div>
    </div>
  );
}
