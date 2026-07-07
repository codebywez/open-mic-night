import { Mic } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize = size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5";
  const textSize = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";

  const content = (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid place-items-center rounded-lg bg-primary/10 p-1.5 text-primary">
        <Mic className={iconSize} aria-hidden />
      </span>
      <span className={textSize}>{APP_NAME}</span>
    </span>
  );

  if (href === null) return content;

  return (
    <Link
      href={href}
      className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}
