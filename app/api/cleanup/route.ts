import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Deletes all expired events (and, by cascade, their performers + secrets).
 * Protect with the CLEANUP_SECRET env var. Call from a platform scheduler
 * (e.g. Vercel Cron) or a simple cron job:
 *
 *   curl -X POST https://your-host/api/cleanup -H "Authorization: Bearer <CLEANUP_SECRET>"
 */
async function handle(request: Request): Promise<NextResponse> {
  const secret = process.env.CLEANUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cleanup is not configured." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("delete_expired_events");
    if (error) throw error;
    return NextResponse.json({ ok: true, deleted: data ?? 0 });
  } catch {
    return NextResponse.json({ error: "Cleanup failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
