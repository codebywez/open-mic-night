"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CalendarClock, CheckCircle2, Settings, Share2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { StatusBadge } from "@/components/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLiveEvent } from "@/hooks/use-live-event";
import { MAX_SONGS, MIN_SONGS } from "@/lib/config";
import { formatClockTime } from "@/lib/format";
import { buildSchedule } from "@/lib/timing";
import {
  addPerformer,
  removePerformer,
  reorderPerformers,
  setEventStatus,
  setPerformerStatus,
  updatePerformer,
} from "@/server/actions/host";
import type { EventRow, PerformerRow } from "@/types/database";
import { PerformerFormSheet, type PerformerFormValues } from "./performer-form-sheet";
import { SettingsDialog } from "./settings-dialog";
import { ShareDialog } from "./share-dialog";
import { type CardHandlers, SortablePerformerCard } from "./sortable-performer-card";

function withPositions(rows: PerformerRow[]): PerformerRow[] {
  return rows.map((p, i) => ({ ...p, queue_position: i + 1 }));
}

export function HostControl({
  initialEvent,
  initialPerformers,
  token,
}: {
  initialEvent: EventRow;
  initialPerformers: PerformerRow[];
  token: string;
}) {
  const router = useRouter();
  const { event, performers, now } = useLiveEvent(initialEvent, initialPerformers);
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  // Local optimistic ordering, re-seeded whenever authoritative data changes.
  const [ordered, setOrdered] = useState(performers);
  useEffect(() => {
    setOrdered(performers);
  }, [performers]);

  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PerformerRow | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PerformerRow | null>(null);
  const [endOpen, setEndOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const schedule = useMemo(() => buildSchedule(event, ordered, now), [event, ordered, now]);
  const scheduleById = useMemo(
    () => new Map(schedule.items.map((i) => [i.performer.id, i])),
    [schedule],
  );

  const active = ordered.filter((p) => p.status !== "completed");
  const done = ordered.filter((p) => p.status === "completed");

  async function run<T extends { ok: boolean; error?: string }>(
    promise: Promise<T>,
    successMsg?: string,
  ): Promise<boolean> {
    setPending(true);
    const res = await promise;
    setPending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Something went wrong.");
      return false;
    }
    if (successMsg) toast.success(successMsg);
    startTransition(() => router.refresh());
    return true;
  }

  async function handleDragEnd(dndEvent: DragEndEvent) {
    const { active: dragged, over } = dndEvent;
    if (!over || dragged.id === over.id) return;
    const activeIds = active.map((p) => p.id);
    const from = activeIds.indexOf(dragged.id as string);
    const to = activeIds.indexOf(over.id as string);
    if (from === -1 || to === -1) return;

    const newActive = arrayMove(active, from, to);
    const nextOrdered = withPositions([...newActive, ...done]);
    setOrdered(nextOrdered);
    await run(
      reorderPerformers(
        event.slug,
        token,
        nextOrdered.map((p) => p.id),
      ),
    );
  }

  function cardHandlers(performer: PerformerRow): CardHandlers {
    return {
      onStart: () => run(setPerformerStatus(event.slug, token, performer.id, "start")),
      onComplete: () => run(setPerformerStatus(event.slug, token, performer.id, "complete")),
      onReset: () => run(setPerformerStatus(event.slug, token, performer.id, "reset")),
      onRemove: () => setRemoveTarget(performer),
      onEdit: () => setEditing(performer),
      onSongsDelta: (delta) => {
        const next = Math.min(MAX_SONGS, Math.max(MIN_SONGS, performer.songs + delta));
        if (next === performer.songs) return;
        run(updatePerformer(event.slug, token, performer.id, { songs: next }));
      },
    };
  }

  async function handleAdd(values: PerformerFormValues): Promise<boolean> {
    return run(
      addPerformer(event.slug, token, {
        displayName: values.displayName,
        performanceType: values.performanceType,
        songs: values.songs,
        setupOverride: values.setupOverride,
      }),
      "Performer added",
    );
  }

  async function handleEdit(values: PerformerFormValues): Promise<boolean> {
    if (!editing) return false;
    return run(
      updatePerformer(event.slug, token, editing.id, {
        displayName: values.displayName,
        performanceType: values.performanceType,
        songs: values.songs,
        setupOverride: values.setupOverride,
      }),
      "Performer updated",
    );
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    const target = removeTarget;
    setRemoveTarget(null);
    await run(removePerformer(event.slug, token, target.id), `${target.display_name} removed`);
  }

  const isFinished = event.status === "finished" || event.status === "expired";

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <Brand href={null} size="sm" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Share"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-5" aria-hidden />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-4 py-5 pb-28">
        {/* Event summary */}
        <section className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-sm text-muted-foreground">Host control</p>
          </div>
          <StatusBadge status={event.status} />
        </section>

        {/* Timing summary */}
        <section className="grid grid-cols-3 gap-2">
          <Stat label="In queue" value={`${active.length}`} />
          <Stat
            label="Est. finish"
            value={schedule.estimatedFinish ? formatClockTime(schedule.estimatedFinish) : "—"}
            warn={schedule.isOverrunning}
          />
          <Stat
            label="Room for"
            value={schedule.capacityRemaining !== null ? `~${schedule.capacityRemaining}` : "—"}
          />
        </section>

        {schedule.isOverrunning && (
          <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
            <CalendarClock className="size-4" aria-hidden />
            Running past the scheduled finish. Consider trimming songs.
          </p>
        )}

        {/* Add performer */}
        <Button variant="outline" onClick={() => setAddOpen(true)} disabled={pending}>
          <UserPlus className="size-4" aria-hidden />
          Add performer
        </Button>

        {/* Active queue */}
        {active.length === 0 && done.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="font-medium text-muted-foreground">No performers yet</p>
            <p className="text-sm text-muted-foreground">
              Share your QR code to get started, or add a performer manually.
            </p>
            <Button variant="outline" size="sm" className="mt-1" onClick={() => setShareOpen(true)}>
              <Share2 className="size-4" aria-hidden />
              Share QR code
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={active.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-2">
                {active.map((performer, index) => {
                  const item = scheduleById.get(performer.id);
                  if (!item) return null;
                  return (
                    <SortablePerformerCard
                      key={performer.id}
                      item={item}
                      index={index}
                      handlers={cardHandlers(performer)}
                      disabled={pending}
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {/* Completed */}
        {done.length > 0 && (
          <section className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="size-4" aria-hidden />
              Finished ({done.length})
            </p>
            <ul className="flex flex-col gap-2">
              {done.map((performer) => {
                const item = scheduleById.get(performer.id);
                if (!item) return null;
                return (
                  <SortablePerformerCard
                    key={performer.id}
                    item={item}
                    index={0}
                    handlers={cardHandlers(performer)}
                    disabled={pending}
                  />
                );
              })}
            </ul>
          </section>
        )}

        {/* Event lifecycle */}
        <section className="mt-2">
          {isFinished ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => run(setEventStatus(event.slug, token, "open"), "Event reopened")}
            >
              Reopen event
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              disabled={pending}
              onClick={() => setEndOpen(true)}
            >
              End event
            </Button>
          )}
        </section>
      </main>

      {/* Dialogs & sheets */}
      <ShareDialog
        slug={event.slug}
        token={token}
        eventName={event.name}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
      <SettingsDialog
        event={event}
        token={token}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <PerformerFormSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add performer"
        description="Add someone to the queue manually."
        submitLabel="Add performer"
        initial={{
          displayName: "",
          performanceType: "solo",
          songs: event.settings.songs,
          setupOverride: null,
        }}
        onSubmit={handleAdd}
      />

      <PerformerFormSheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit performer"
        submitLabel="Save changes"
        initial={{
          displayName: editing?.display_name ?? "",
          performanceType: editing?.performance_type ?? "solo",
          songs: editing?.songs ?? event.settings.songs,
          setupOverride: editing?.setup_override ?? null,
        }}
        onSubmit={handleEdit}
      />

      <AlertDialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from the queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={endOpen} onOpenChange={setEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this event?</AlertDialogTitle>
            <AlertDialogDescription>
              Sign-ups will close and the event will be marked as finished. You can reopen it
              afterwards if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEndOpen(false);
                run(setEventStatus(event.slug, token, "finished"), "Event ended");
              }}
            >
              End event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-bold tabular-nums ${warn ? "text-amber-600 dark:text-amber-400" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
