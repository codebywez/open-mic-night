import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseServiceEnv } from "./env";

/**
 * Server-side admin client using the service role key. Bypasses RLS.
 * Use ONLY in server actions / route handlers for writes and for reading
 * host secrets. Never import into a Client Component.
 */
export function getSupabaseAdminClient() {
  const { url, serviceKey } = getSupabaseServiceEnv();
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
