"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Renders a QR code to a canvas. Always high-contrast (dark on white) for scanability. */
export function QrCode({
  value,
  size = 200,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch(() => {});
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      role="img"
      aria-label="QR code"
      className={cn("rounded-lg bg-white", className)}
    />
  );
}

/** Generates and downloads a PNG of the QR code for the given URL. */
export async function downloadQrCode(value: string, filename: string): Promise<void> {
  const dataUrl = await QRCode.toDataURL(value, {
    width: 1024,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
