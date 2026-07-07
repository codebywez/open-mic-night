// Combining diacritical marks range (U+0300–U+036F).
const DIACRITICS = /[̀-ͯ]/g;

/**
 * Converts arbitrary text into a URL-safe slug candidate (format only — does
 * not check length, reserved words or availability). Pure, safe on the client.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(DIACRITICS, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 32)
    .replace(/-+$/g, ""); // re-trim after truncation
}
