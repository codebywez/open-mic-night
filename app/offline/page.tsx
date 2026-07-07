import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { MessageScreen } from "@/components/message-screen";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <MessageScreen
      icon={WifiOff}
      title="You're offline"
      description="Open Mic Night needs a connection for live queue updates. Reconnect and try again."
    />
  );
}
