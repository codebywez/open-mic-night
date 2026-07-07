"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Minus, Plus } from "lucide-react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { MAX_SONGS, MIN_SONGS, PERFORMANCE_TYPES } from "@/lib/config";
import { type JoinQueueValues, joinQueueSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { joinQueue } from "@/server/actions/queue";

const TYPES = Object.entries(PERFORMANCE_TYPES).map(([value, meta]) => ({
  value: value as JoinQueueValues["performanceType"],
  label: meta.label,
}));

export function JoinQueueSheet({
  slug,
  defaultSongs,
  open,
  onOpenChange,
  onJoined,
}: {
  slug: string;
  defaultSongs: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: (performerId: string) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<JoinQueueValues>({
    resolver: zodResolver(joinQueueSchema) as Resolver<JoinQueueValues>,
    defaultValues: { displayName: "", performanceType: "solo", songs: defaultSongs },
  });

  async function onSubmit(values: JoinQueueValues) {
    const result = await joinQueue(slug, values);
    if (result.ok) {
      toast.success("You're in the queue");
      onJoined(result.performerId);
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Join the queue</DrawerTitle>
            <DrawerDescription>Takes about ten seconds. No sign-up needed.</DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                autoFocus
                placeholder="Your name or act"
                autoComplete="off"
                aria-invalid={!!errors.displayName}
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message}</p>
              )}
            </div>

            <Controller
              control={control}
              name="performanceType"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Performance type</Label>
                  <div
                    className="grid grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label="Performance type"
                  >
                    {TYPES.map((t) => {
                      const active = field.value === t.value;
                      return (
                        // biome-ignore lint/a11y/useSemanticElements: styled segmented radio control
                        <button
                          key={t.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => field.onChange(t.value)}
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
              )}
            />

            <Controller
              control={control}
              name="songs"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Songs</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Fewer songs"
                      disabled={field.value <= MIN_SONGS}
                      onClick={() => field.onChange(Math.max(MIN_SONGS, field.value - 1))}
                    >
                      <Minus className="size-4" aria-hidden />
                    </Button>
                    <span className="min-w-10 text-center text-xl font-semibold tabular-nums">
                      {field.value}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="More songs"
                      disabled={field.value >= MAX_SONGS}
                      onClick={() => field.onChange(Math.min(MAX_SONGS, field.value + 1))}
                    >
                      <Plus className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              )}
            />

            <DrawerFooter className="px-0">
              <Button type="submit" size="lg" className="h-12 text-base" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    Joining…
                  </>
                ) : (
                  "Join Queue"
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
