import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { MessageScreen } from "@/components/message-screen";
import { HostControl } from "@/features/host/host-control";
import { getPerformers } from "@/lib/data";
import { verifyHostToken } from "@/server/actions/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Host Control",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ slug: string; token: string }> };

export default async function ManagePage({ params }: Params) {
  const { slug, token } = await params;
  const auth = await verifyHostToken(slug, token).catch(() => ({ ok: false }) as const);

  if (!auth.ok) {
    return (
      <MessageScreen
        icon={KeyRound}
        title="Host link invalid"
        description="This host link is incorrect or the event has ended. Host links cannot be recovered, so make sure you're using the exact link you saved."
      />
    );
  }

  const performers = await getPerformers(auth.eventId);
  return <HostControl initialEvent={auth.event} initialPerformers={performers} token={token} />;
}
