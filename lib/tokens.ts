import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { customAlphabet } from "nanoid";
import { RESERVED_SLUGS } from "./config";
import { slugify } from "./slug";

// Unambiguous lowercase alphabet (no 0/o/1/l/i) for human-friendly slugs.
const slugAlphabet = "abcdefghjkmnpqrstuvwxyz23456789";
const nanoSlug = customAlphabet(slugAlphabet, 8);

// Larger alphabet + length for the secret host token.
const tokenAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const nanoToken = customAlphabet(tokenAlphabet, 32);

export function generateSlug(): string {
  return nanoSlug();
}

export function generateHostToken(): string {
  return nanoToken();
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of a plaintext token against a stored hash. */
export function verifyToken(token: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashToken(token));
  const stored = Buffer.from(storedHash);
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

export type SlugValidation = { ok: true; slug: string } | { ok: false; reason: string };

/** Normalises and validates a user-supplied custom slug (format only, not availability). */
export function normalizeSlug(input: string): SlugValidation {
  const slug = slugify(input);

  if (slug.length < 3) return { ok: false, reason: "Web address must be at least 3 characters." };
  if (slug.length > 32) return { ok: false, reason: "Web address must be 32 characters or fewer." };
  if (!SLUG_PATTERN.test(slug))
    return { ok: false, reason: "Use letters, numbers and hyphens only." };
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return { ok: false, reason: "That web address is reserved." };
  }
  return { ok: true, slug };
}

/** Suggests alternative slugs when a desired one is taken. */
export function suggestSlugs(base: string): string[] {
  const normalized = normalizeSlug(base);
  const root = normalized.ok ? normalized.slug : "openmic";
  const suffixes = [
    Math.floor(Math.random() * 90 + 10).toString(),
    Math.floor(Math.random() * 900 + 100).toString(),
    nanoSlug().slice(0, 4),
  ];
  return suffixes.map((s) => `${root}-${s}`.slice(0, 32));
}
