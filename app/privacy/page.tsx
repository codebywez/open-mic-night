import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { APP_NAME, CLEANUP_AFTER_HOURS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <article className="prose-sm flex flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Privacy</h1>
          <p className="text-muted-foreground">
            {APP_NAME} is built to collect as little as possible. There are no accounts, passwords,
            emails, phone numbers, or tracking that requires consent.
          </p>

          <Section title="What we store">
            The event details you enter (name, optional date and times, timing settings) and, for
            each performer, only a display name, performance type and number of songs. That's it.
          </Section>

          <Section title="Host links">
            Each event has a private host link. We store only a one-way hash of its secret token, so
            the link cannot be recovered if you lose it — and it can't be read back out of our
            database.
          </Section>

          <Section title="Automatic deletion">
            Every event and all of its data is permanently deleted roughly {CLEANUP_AFTER_HOURS}{" "}
            hours after it finishes. There are no backups. Nothing lingers.
          </Section>

          <Section title="No analytics">
            We don't use cookies or analytics that would require a consent banner. The only local
            data stored on your device is your theme preference and, if you join a queue, a
            reference so this device can show your position.
          </Section>
        </article>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground">{children}</p>
    </section>
  );
}
