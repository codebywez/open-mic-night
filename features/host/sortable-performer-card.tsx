"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Minus, Pencil, Play, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SONGS, MIN_SONGS, PERFORMANCE_TYPES } from "@/lib/config";
import { formatClockTime } from "@/lib/format";
import type { ScheduledPerformer } from "@/lib/timing";
import { cn } from "@/lib/utils";

export interface CardHandlers {
  onStart: () => void;
  onComplete: () => void;
  onReset: () => void;
  onRemove: () => void;
  onEdit: () => void;
  onSongsDelta: (delta: number) => void;
}

export function SortablePerformerCard({
  item,
  index,
  handlers,
  disabled,
}: {
  item: ScheduledPerformer;
  index: number;
  handlers: CardHandlers;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.performer.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { performer } = item;
  const isPerforming = performer.status === "performing";
  const isDone = performer.status === "completed";
  const typeLabel = PERFORMANCE_TYPES[performer.performance_type].label;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4",
        isPerforming && "border-primary/50 bg-primary/5",
        isDone && "opacity-60",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
          aria-label={`Reorder ${performer.display_name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <p className="truncate font-semibold">{performer.display_name}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{typeLabel}</span>
            {performer.setup_override !== null && (
              <span className="rounded-full bg-muted px-2 py-0.5">
                {performer.setup_override}m setup
              </span>
            )}
            {isPerforming ? (
              <span className="font-medium text-primary">On stage now</span>
            ) : isDone ? (
              <span>Finished</span>
            ) : (
              item.startAt && <span>~{formatClockTime(item.startAt)}</span>
            )}
          </div>
        </div>

        {/* Songs stepper */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Fewer songs"
            disabled={disabled || performer.songs <= MIN_SONGS}
            onClick={() => handlers.onSongsDelta(-1)}
          >
            <Minus className="size-3.5" aria-hidden />
          </Button>
          <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
            {performer.songs}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">♪</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="More songs"
            disabled={disabled || performer.songs >= MAX_SONGS}
            onClick={() => handlers.onSongsDelta(1)}
          >
            <Plus className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isPerforming ? (
          <Button size="sm" onClick={handlers.onComplete} disabled={disabled}>
            <Check className="size-4" aria-hidden />
            Complete
          </Button>
        ) : isDone ? (
          <Button size="sm" variant="outline" onClick={handlers.onReset} disabled={disabled}>
            <RotateCcw className="size-4" aria-hidden />
            Requeue
          </Button>
        ) : (
          <Button size="sm" onClick={handlers.onStart} disabled={disabled}>
            <Play className="size-4" aria-hidden />
            Start
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={handlers.onEdit} disabled={disabled}>
          <Pencil className="size-4" aria-hidden />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={handlers.onRemove}
          disabled={disabled}
        >
          <X className="size-4" aria-hidden />
          Remove
        </Button>
      </div>
    </li>
  );
}
