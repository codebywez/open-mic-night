"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <SiteHeader brandHref={null} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <TriangleAlert className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try again — your event data is safe.
        </p>
        <Button onClick={reset}>Try again</Button>
      </main>
    </>
  );
}
