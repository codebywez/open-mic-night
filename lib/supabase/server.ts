import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseBrowserEnv } from "./env";

/**
 * Server-side read client using the anon key. Respects RLS (public SELECT).
 * Use in Server Components for reading events/performers.
 */
export function getSupabaseServerClient() {
  const { url, anonKey } = getSupabaseBrowserEnv();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
