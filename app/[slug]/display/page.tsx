import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DisplayScreen } from "@/features/event/display-screen";
import { getEventWithPerformers } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEventWithPerformers(slug).catch(() => null);
  return { title: data ? `${data.event.name} — Display` : "Display" };
}

export default async function DisplayPage({ params }: Params) {
  const { slug } = await params;
  const data = await getEventWithPerformers(slug).catch(() => null);
  if (!data) notFound();

  return <DisplayScreen initialEvent={data.event} initialPerformers={data.performers} />;
}
