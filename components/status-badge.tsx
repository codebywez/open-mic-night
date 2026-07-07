import { cn } from "@/lib/utils";
import type { EventStatus } from "@/types/database";

type Tone = "open" | "closed" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  open: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
  muted: "bg-muted text-muted-foreground border-border",
};

/**
 * Sign-ups-first status: the badge reflects whether performers can join
 * (Sign-ups Open / Sign-ups Closed) rather than the internal lifecycle state,
 * so it stays meaningful — and tappable in host control — while an event runs.
 */
function badgeMeta(status: EventStatus, signupsClosed?: boolean): { label: string; tone: Tone } {
  if (status === "finished" || status === "expired") return { label: "Finished", tone: "closed" };
  if (status === "draft") return { label: "Draft", tone: "muted" };
  if (signupsClosed) return { label: "Sign-ups Closed", tone: "closed" };
  return { label: "Sign-ups Open", tone: "open" };
}

export function StatusBadge({
  status,
  signupsClosed,
  className,
  pulse = true,
}: {
  status: EventStatus;
  signupsClosed?: boolean;
  className?: string;
  pulse?: boolean;
}) {
  const meta = badgeMeta(status, signupsClosed);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      {meta.tone === "open" && pulse && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      )}
      {meta.label}
    </span>
  );
}
