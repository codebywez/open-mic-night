"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SITE_URL } from "@/lib/config";
import { type CreateEventInput, type CreateEventValues, createEventSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { createEvent } from "@/server/actions/events";
import { EventCreated } from "./event-created";

const urlHost = SITE_URL.replace(/^https?:\/\//, "");

function todayIso(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

export function CreateEventForm() {
  const router = useRouter();
  const [created, setCreated] = useState<{ slug: string; token: string; name: string } | null>(
    null,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const form = useForm<CreateEventInput, unknown, CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      slug: "",
      date: todayIso(),
      startTime: "",
      endTime: "",
      songs: 3,
      songDurationMinutes: 4,
      songChangeMinutes: 1,
      setupMinutes: { solo: 2, duo: 3, band: 5 },
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: CreateEventValues) {
    setSuggestions([]);
    const result = await createEvent(values);
    if (result.ok) {
      toast.success("Event created");
      setCreated({ slug: result.slug, token: result.token, name: values.name });
      return;
    }
    if (result.field === "slug") {
      setError("slug", { message: result.error });
      if (result.suggestions) setSuggestions(result.suggestions);
    } else {
      toast.error(result.error);
    }
  }

  if (created) {
    return <EventCreated slug={created.slug} token={created.token} eventName={created.name} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create your event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only a name is required. Everything else has sensible defaults you can change later.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          Event name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          autoFocus
          placeholder="Tuesday Open Mic"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Web address (optional)</Label>
        <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
          <span className="pl-3 text-sm text-muted-foreground">{urlHost}/</span>
          <Input
            id="slug"
            className="border-0 pl-1 shadow-none focus-visible:ring-0"
            placeholder="auto-generated"
            autoCapitalize="none"
            autoCorrect="off"
            aria-invalid={!!errors.slug}
            {...register("slug")}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave blank to generate an automatic short code.
        </p>
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Try:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setValue("slug", s, { shouldValidate: false });
                  setError("slug", { message: "" });
                  setSuggestions([]);
                }}
                className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register("date")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
        aria-expanded={showAdvanced}
      >
        <ChevronDown
          className={cn("size-4 transition-transform", showAdvanced && "rotate-180")}
          aria-hidden
        />
        Timing settings
      </button>

      {showAdvanced && (
        <div className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="songs">Default songs</Label>
              <Input
                id="songs"
                type="number"
                min={1}
                max={10}
                {...register("songs", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="songDuration">Song length (min)</Label>
              <Input
                id="songDuration"
                type="number"
                min={0}
                max={30}
                {...register("songDurationMinutes", { valueAsNumber: true })}
              />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Setup time per act (min)</legend>
            <div className="grid grid-cols-3 gap-3">
              {(["solo", "duo", "band"] as const).map((type) => (
                <div key={type} className="space-y-1.5">
                  <Label htmlFor={`setup-${type}`} className="capitalize">
                    {type}
                  </Label>
                  <Input
                    id={`setup-${type}`}
                    type="number"
                    min={0}
                    max={60}
                    {...register(`setupMinutes.${type}`, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <Button type="submit" size="lg" className="h-12 text-base" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Creating…
          </>
        ) : (
          "Create Event"
        )}
      </Button>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </form>
  );
}
