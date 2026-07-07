import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: "Open Mic",
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#6d28d9",
    orientation: "portrait",
    categories: ["music", "productivity", "events"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
