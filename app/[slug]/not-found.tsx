import { SearchX } from "lucide-react";
import { MessageScreen } from "@/components/message-screen";

export default function EventNotFound() {
  return (
    <MessageScreen
      icon={SearchX}
      title="Event not found"
      description="This event doesn't exist, or it has finished and its data was automatically deleted."
    />
  );
}
