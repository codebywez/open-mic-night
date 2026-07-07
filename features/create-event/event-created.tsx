"use client";

import { AlertTriangle, ArrowRight, ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { downloadQrCode, QrCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import { buildEventUrl, buildManageUrl } from "@/lib/config";
import { shareLink } from "@/lib/share";

export function EventCreated({
  slug,
  token,
  eventName,
}: {
  slug: string;
  token: string;
  eventName: string;
}) {
  const publicUrl = buildEventUrl(slug);
  const manageUrl = buildManageUrl(slug, token);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Event created</h1>
        <p className="mt-1 text-muted-foreground">Share the public link so performers can join.</p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5">
        <QrCode value={publicUrl} size={200} className="p-3" />
        <p className="break-all text-center text-sm font-medium">{publicUrl}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <CopyButton value={publicUrl} message="Public link copied" label="Copy link" />
          <Button
            type="button"
            variant="outline"
            onClick={() => shareLink({ title: eventName, url: publicUrl })}
          >
            Share
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadQrCode(publicUrl, `${slug}-qr`)}
          >
            Download QR
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="mb-2 flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
          <ShieldAlert className="size-5" aria-hidden />
          Save your Host Control link
        </div>
        <p className="text-sm text-muted-foreground">
          Anyone with this link can manage your event. It{" "}
          <strong className="text-foreground">cannot be recovered</strong> because there are no
          accounts. Bookmark it or copy it somewhere safe now.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton
            value={manageUrl}
            message="Host link copied"
            label="Copy host link"
            variant="default"
          />
          <Button asChild variant="outline">
            <Link href={`/${slug}/manage/${token}`}>
              Open Host Control
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="secondary" className="flex-1">
          <Link href={`/${slug}`} target="_blank" rel="noopener noreferrer">
            Open public event
            <ExternalLink className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        This screen is the only time both links are shown together. The host link is not stored
        anywhere you can look it up later.
      </p>
    </div>
  );
}
