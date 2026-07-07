import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CreateEventForm } from "@/features/create-event/create-event-form";

export const metadata: Metadata = {
  title: "Create Event",
};

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 pb-safe">
        <CreateEventForm />
      </main>
    </>
  );
}
