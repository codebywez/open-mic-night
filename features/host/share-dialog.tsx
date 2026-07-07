"use client";

import { Download, ExternalLink, Mail, Share2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { downloadQrCode, QrCode } from "@/components/qr-code";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDisplayUrl, buildEventUrl, buildManageUrl } from "@/lib/config";
import { shareLink } from "@/lib/share";

export function ShareDialog({
  slug,
  token,
  eventName,
  open,
  onOpenChange,
}: {
  slug: string;
  token: string;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const publicUrl = buildEventUrl(slug);
  const displayUrl = buildDisplayUrl(slug);
  const manageUrl = buildManageUrl(slug, token);

  const mailto = `mailto:?subject=${encodeURIComponent(
    `Join the queue: ${eventName}`,
  )}&body=${encodeURIComponent(`Sign up for ${eventName} here:\n${publicUrl}`)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share event</DialogTitle>
          <DialogDescription>Invite performers and set up your display screen.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Public link + QR */}
          <section className="flex flex-col items-center gap-3">
            <QrCode value={publicUrl} size={180} className="p-3" />
            <div className="flex w-full items-center gap-2">
              <Input readOnly value={publicUrl} className="text-sm" aria-label="Public link" />
              <CopyButton
                value={publicUrl}
                message="Public link copied"
                label=""
                variant="outline"
                size="icon"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareLink({ title: eventName, url: publicUrl })}
              >
                <Share2 className="size-4" aria-hidden />
                Share
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={mailto}>
                  <Mail className="size-4" aria-hidden />
                  Email
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQrCode(publicUrl, `${slug}-qr`)}
              >
                <Download className="size-4" aria-hidden />
                QR PNG
              </Button>
            </div>
          </section>

          {/* Display screen link */}
          <section className="space-y-2">
            <Label>Display screen (for a TV or projector)</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={displayUrl} className="text-sm" aria-label="Display link" />
              <CopyButton
                value={displayUrl}
                message="Display link copied"
                label=""
                variant="outline"
                size="icon"
              />
              <Button variant="outline" size="icon" asChild aria-label="Open display screen">
                <Link href={`/${slug}/display`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </section>

          {/* Host link */}
          <section className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-4" aria-hidden />
              Host link — keep this private
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={manageUrl} className="text-sm" aria-label="Host link" />
              <CopyButton
                value={manageUrl}
                message="Host link copied"
                label=""
                variant="outline"
                size="icon"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can manage the event. It cannot be recovered if lost.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
