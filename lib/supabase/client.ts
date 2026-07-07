"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "./env";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Singleton browser Supabase client (anon key, subject to RLS). */
export function getSupabaseBrowserClient() {
  if (client) return client;
  const { url, anonKey } = getSupabaseBrowserEnv();
  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
