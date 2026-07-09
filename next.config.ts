import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/**
 * This machine's LAN IPv4 addresses. Added to `allowedDevOrigins` so the dev
 * server can be opened from another device on the network (e.g. testing on a
 * phone) without Next.js blocking its dev resources. Dev-only; ignored in prod.
 */
function localNetworkOrigins(): string[] {
  const origins: string[] = [];
  for (const iface of Object.values(networkInterfaces())) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) origins.push(net.address);
    }
  }
  return origins;
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: localNetworkOrigins(),
};

export default nextConfig;
