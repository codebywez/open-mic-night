"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "omn:install-dismissed";

/** Registers the service worker and offers an install prompt when appropriate. */
export function Pwa() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      let dismissed = false;
      try {
        dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {}
      if (dismissed) return;
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
    setInstallEvent(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pb-safe">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Download className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Open Mic Night</p>
          <p className="text-xs text-muted-foreground">
            Add it to your home screen for quick access.
          </p>
        </div>
        <Button size="sm" onClick={install}>
          Install
        </Button>
        <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dismiss">
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
