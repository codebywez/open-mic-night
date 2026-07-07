import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicEvent } from "@/features/event/public-event";
import { getEventWithPerformers } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEventWithPerformers(slug).catch(() => null);
  if (!data) return { title: "Event not found" };
  return {
    title: data.event.name,
    description: `Join the queue for ${data.event.name}.`,
  };
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const data = await getEventWithPerformers(slug).catch(() => null);
  if (!data) notFound();

  return <PublicEvent initialEvent={data.event} initialPerformers={data.performers} />;
}
