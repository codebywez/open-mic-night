"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SONGS, MIN_SONGS, PERFORMANCE_TYPES, type PerformanceType } from "@/lib/config";
import { cn } from "@/lib/utils";

export interface PerformerFormValues {
  displayName: string;
  performanceType: PerformanceType;
  songs: number;
  setupOverride: number | null;
}

const TYPES = Object.entries(PERFORMANCE_TYPES).map(([value, meta]) => ({
  value: value as PerformanceType,
  label: meta.label,
}));

export function PerformerFormSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  initial: PerformerFormValues;
  onSubmit: (values: PerformerFormValues) => Promise<boolean>;
}) {
  const [values, setValues] = useState<PerformerFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever it is opened for a (possibly different) performer.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-seed when the sheet opens
  useEffect(() => {
    if (open) {
      setValues(initial);
      setError(null);
    }
  }, [open]);

  const defaultSetup = PERFORMANCE_TYPES[values.performanceType].setupMinutes;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.displayName.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit({ ...values, displayName: values.displayName.trim() });
    setSubmitting(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="perf-name">
                Display name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="perf-name"
                autoComplete="off"
                value={values.displayName}
                aria-invalid={!!error}
                onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label>Performance type</Label>
              <div
                className="grid grid-cols-3 gap-2"
                role="radiogroup"
                aria-label="Performance type"
              >
                {TYPES.map((t) => {
                  const active = values.performanceType === t.value;
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: styled segmented radio control
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setValues((v) => ({ ...v, performanceType: t.value }))}
                      className={cn(
                        "rounded-xl border py-3 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Songs</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Fewer songs"
                  disabled={values.songs <= MIN_SONGS}
                  onClick={() =>
                    setValues((v) => ({ ...v, songs: Math.max(MIN_SONGS, v.songs - 1) }))
                  }
                >
                  <Minus className="size-4" aria-hidden />
                </Button>
                <span className="min-w-10 text-center text-xl font-semibold tabular-nums">
                  {values.songs}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="More songs"
                  disabled={values.songs >= MAX_SONGS}
                  onClick={() =>
                    setValues((v) => ({ ...v, songs: Math.min(MAX_SONGS, v.songs + 1) }))
                  }
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="perf-setup">Setup time override (min)</Label>
              <Input
                id="perf-setup"
                type="number"
                min={0}
                max={60}
                inputMode="numeric"
                placeholder={`Auto (${defaultSetup} min)`}
                value={values.setupOverride ?? ""}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    setupOverride: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the default for a {values.performanceType}.
              </p>
            </div>

            <DrawerFooter className="px-0">
              <Button type="submit" size="lg" className="h-12 text-base" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
              <DrawerClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
