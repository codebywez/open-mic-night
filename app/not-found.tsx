import { Compass } from "lucide-react";
import { MessageScreen } from "@/components/message-screen";

export default function NotFound() {
  return (
    <MessageScreen
      icon={Compass}
      title="Page not found"
      description="We couldn't find the page you were looking for."
    />
  );
}
