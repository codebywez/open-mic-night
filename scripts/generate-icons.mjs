// Regenerates PWA icons from the brand mark. Run with: node scripts/generate-icons.mjs
import { mkdirSync } from "node:fs";
import sharp from "sharp";

mkdirSync("public/icons", { recursive: true });

const mic = `<g transform="translate(SVG_TX,SVG_TY) scale(SVG_SC)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
  <line x1="12" x2="12" y1="19" y2="22"/>
</g>`;

function iconSvg(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : Math.round(size * 0.22);
  const scale = ((maskable ? size * 0.5 : size * 0.47) / 24).toFixed(3);
  const glyphW = 24 * Number(scale);
  const tx = ((size - glyphW) / 2).toFixed(1);
  const ty = ((size - 26 * Number(scale)) / 2).toFixed(1);
  const g = mic.replaceAll("SVG_TX", tx).replaceAll("SVG_TY", ty).replaceAll("SVG_SC", scale);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#6d28d9"/>${g}</svg>`;
}

async function png(size, out, opts) {
  await sharp(Buffer.from(iconSvg(size, opts)))
    .png()
    .toFile(out);
  console.log("wrote", out);
}

await png(192, "public/icons/icon-192.png");
await png(512, "public/icons/icon-512.png");
await png(512, "public/icons/maskable-512.png", { maskable: true });
await png(180, "public/icons/apple-touch-icon.png");
await png(32, "public/icons/favicon-32.png");
