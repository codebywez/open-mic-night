import { toast } from "sonner";

export async function copyText(text: string, message = "Link copied"): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Could not copy. Please copy the link manually.");
  }
}

/** Uses the native share sheet when available, otherwise falls back to copying. */
export async function shareLink(data: {
  title?: string;
  text?: string;
  url: string;
}): Promise<void> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share(data);
      return;
    } catch (err) {
      // AbortError means the user dismissed the sheet — do nothing.
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }
  await copyText(data.url, "Link copied");
}
