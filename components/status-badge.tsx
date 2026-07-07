import { eventStatusMeta } from "@/lib/queue";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@/types/database";

const TONE_CLASSES: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  live: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  closed: "bg-muted text-muted-foreground border-border",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  status,
  className,
  pulse = true,
}: {
  status: EventStatus;
  className?: string;
  pulse?: boolean;
}) {
  const meta = eventStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      {(meta.tone === "live" || meta.tone === "open") && pulse && (
        <span className="relative flex size-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              meta.tone === "live" ? "bg-red-500" : "bg-emerald-500",
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              meta.tone === "live" ? "bg-red-500" : "bg-emerald-500",
            )}
          />
        </span>
      )}
      {meta.label}
    </span>
  );
}
