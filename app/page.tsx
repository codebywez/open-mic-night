import { ArrowRight, CalendarClock, ListMusic, QrCode } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";

const FEATURES = [
  {
    icon: QrCode,
    title: "Share a QR code",
    body: "Performers scan and join their own queue in seconds. No app, no sign-up.",
  },
  {
    icon: CalendarClock,
    title: "Automatic timings",
    body: "Estimated start times update live as the running order changes.",
  },
  {
    icon: ListMusic,
    title: "Run it from your phone",
    body: "Reorder, start and complete acts from a phone or tablet as the night unfolds.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader brandHref={null} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            Free • No accounts • Works on any device
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">{APP_NAME}</h1>
          <p className="max-w-xl text-balance text-lg text-muted-foreground">
            Create and manage an open mic queue in under 30 seconds. Share a QR code, let performers
            sign themselves up, and run the whole night from your phone.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/create">
                Create Event
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">No card. No email. Nothing to install.</p>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5">
              <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mb-1 font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-1 px-4 text-center text-xs text-muted-foreground">
          <p>All event data is automatically deleted after the event. No tracking, no accounts.</p>
        </div>
      </footer>
    </>
  );
}
