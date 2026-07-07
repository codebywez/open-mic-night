"use client";

import { PartyPopper, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatClockTime, formatRelativeTo } from "@/lib/format";
import { deriveQueueGroups } from "@/lib/queue";
import { isMuted, playChime, setMuted, vibrate } from "@/lib/sound";
import { buildSchedule } from "@/lib/timing";
import { cn } from "@/lib/utils";
import { leaveQueue } from "@/server/actions/queue";
import type { EventRow, PerformerRow } from "@/types/database";

type Stage = "up" | "next" | "waiting" | "done" | "gone";

export function YourPosition({
  event,
  performers,
  now,
  performerId,
  onLeave,
}: {
  event: EventRow;
  performers: PerformerRow[];
  now: Date;
  performerId: string;
  onLeave: () => void;
}) {
  const [muted, setMutedState] = useState(false);
  const prevStage = useRef<Stage | null>(null);

  useEffect(() => setMutedState(isMuted()), []);

  const schedule = buildSchedule(event, performers, now);
  const groups = deriveQueueGroups(schedule);
  const me = schedule.items.find((i) => i.performer.id === performerId);

  let stage: Stage;
  if (!me) stage = "gone";
  else if (me.performer.status === "completed") stage = "done";
  else if (groups.nowPlaying?.performer.id === performerId) stage = "up";
  else if (groups.onDeck?.performer.id === performerId) stage = "next";
  else stage = "waiting";

  // Play a cue when the performer newly becomes next or is called up.
  useEffect(() => {
    const prev = prevStage.current;
    if (prev && prev !== stage && (stage === "next" || stage === "up")) {
      playChime();
      vibrate(stage === "up" ? [200, 80, 200] : [120, 60, 120]);
    }
    prevStage.current = stage;
  }, [stage]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  async function handleLeave() {
    const result = await leaveQueue(event.slug, performerId);
    if (result.ok) {
      toast.success("You've left the queue");
      onLeave();
    } else {
      toast.error(result.error);
    }
  }

  if (stage === "gone") {
    return (
      <Panel tone="muted">
        <p className="text-lg font-semibold">You're no longer in the queue</p>
        <p className="text-sm text-muted-foreground">
          The host may have removed you, or the event has ended.
        </p>
        <Button variant="outline" onClick={onLeave} className="mt-2">
          Dismiss
        </Button>
      </Panel>
    );
  }

  if (stage === "done") {
    return (
      <Panel tone="muted">
        <PartyPopper className="size-8 text-primary" aria-hidden />
        <p className="text-lg font-semibold">Thanks for playing!</p>
        <p className="text-sm text-muted-foreground">
          Your set is complete. Enjoy the rest of the night.
        </p>
      </Panel>
    );
  }

  const position = schedule.items
    .filter((i) => i.performer.status !== "completed")
    .findIndex((i) => i.performer.id === performerId);

  return (
    <Panel tone={stage === "up" ? "up" : stage === "next" ? "next" : "default"}>
      <div className="flex w-full items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {me?.performer.display_name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          aria-label={muted ? "Unmute alerts" : "Mute alerts"}
        >
          {muted ? (
            <VolumeX className="size-5" aria-hidden />
          ) : (
            <Volume2 className="size-5" aria-hidden />
          )}
        </Button>
      </div>

      {stage === "up" ? (
        <p className="text-4xl font-bold tracking-tight text-primary">You're up!</p>
      ) : stage === "next" ? (
        <p className="text-4xl font-bold tracking-tight">You're next</p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Position</span>
          <span className="text-4xl font-bold tabular-nums">{position + 1}</span>
        </div>
      )}

      {stage === "waiting" && me?.startAt && (
        <p className="text-muted-foreground">
          Estimated start{" "}
          <span className="font-medium text-foreground">{formatClockTime(me.startAt)}</span> (
          {formatRelativeTo(me.startAt, now)})
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted-foreground">Keep this page open for live updates.</p>
        {stage !== "up" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Leave queue
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave the queue?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll lose your spot. You can join again, but you'll go to the back of the line.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeave}>Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Panel>
  );
}

function Panel({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "up" | "next" | "waiting" | "default" | "muted";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 rounded-2xl border p-5",
        tone === "up" && "border-primary/60 bg-primary/15 ring-1 ring-primary/20",
        tone === "next" && "border-primary/40 bg-primary/10",
        (tone === "default" || tone === "waiting") && "border-primary/30 bg-primary/5",
        tone === "muted" && "items-center border-border bg-card text-center",
      )}
    >
      {children}
    </div>
  );
}
