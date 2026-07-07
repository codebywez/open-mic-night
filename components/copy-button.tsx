"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/share";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  message,
  label = "Copy",
  ariaLabel,
  variant = "outline",
  size = "default",
  className,
}: {
  value: string;
  message?: string;
  label?: string;
  ariaLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyText(value, message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={ariaLabel ?? (label ? undefined : "Copy")}
      className={cn(className)}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {label}
    </Button>
  );
}
