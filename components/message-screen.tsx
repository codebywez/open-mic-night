import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export function MessageScreen({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <>
      <SiteHeader brandHref={null} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="mt-2">
          {action ?? (
            <Button asChild>
              <Link href="/">Back home</Link>
            </Button>
          )}
        </div>
      </main>
    </>
  );
}
