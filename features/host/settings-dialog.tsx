"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildEventUrl } from "@/lib/config";
import { type CreateEventInput, type CreateEventValues, createEventSchema } from "@/lib/schemas";
import { updateEventSettings } from "@/server/actions/events";
import { deleteEvent } from "@/server/actions/host";
import type { EventRow } from "@/types/database";

export function SettingsDialog({
  event,
  token,
  open,
  onOpenChange,
}: {
  event: EventRow;
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventInput, unknown, CreateEventValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: event.name,
      slug: "",
      date: event.event_date ?? "",
      startTime: event.start_time?.slice(0, 5) ?? "",
      endTime: event.end_time?.slice(0, 5) ?? "",
      songs: event.settings.songs,
      songDurationMinutes: event.settings.songDurationMinutes,
      songChangeMinutes: event.settings.songChangeMinutes,
      setupMinutes: event.settings.setupMinutes,
    },
  });

  async function onSubmit(values: CreateEventValues) {
    const result = await updateEventSettings(event.slug, token, values);
    if (result.ok) {
      toast.success("Settings saved");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteEvent(event.slug, token);
    if (result.ok) {
      toast.success("Event ended and deleted");
      router.push("/");
    } else {
      toast.error(result.error);
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Event settings</DialogTitle>
          <DialogDescription>Update the details and timing for your event.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="s-name">Event name</Label>
            <Input id="s-name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Public URL</Label>
            <Input
              readOnly
              value={buildEventUrl(event.slug)}
              className="text-sm text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-date">Date</Label>
            <Input id="s-date" type="date" {...register("date")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="s-start">Start time</Label>
              <Input id="s-start" type="time" {...register("startTime")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-end">Finish time</Label>
              <Input id="s-end" type="time" {...register("endTime")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="s-songs">Songs</Label>
              <Input
                id="s-songs"
                type="number"
                min={1}
                max={10}
                {...register("songs", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-dur">Song (min)</Label>
              <Input
                id="s-dur"
                type="number"
                min={0}
                max={30}
                {...register("songDurationMinutes", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-change">Change (min)</Label>
              <Input
                id="s-change"
                type="number"
                min={0}
                max={10}
                {...register("songChangeMinutes", { valueAsNumber: true })}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Setup time per act (min)</legend>
            <div className="grid grid-cols-3 gap-3">
              {(["solo", "duo", "band"] as const).map((type) => (
                <div key={type} className="space-y-1.5">
                  <Label htmlFor={`s-setup-${type}`} className="capitalize">
                    {type}
                  </Label>
                  <Input
                    id={`s-setup-${type}`}
                    type="number"
                    min={0}
                    max={60}
                    {...register(`setupMinutes.${type}`, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <Button type="submit" className="h-11" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </form>

        <div className="mt-2 border-t border-border pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                disabled={deleting}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes the event, its queue and the host link. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
