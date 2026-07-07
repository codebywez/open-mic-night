-- Optional: schedule automatic cleanup with pg_cron (available on Supabase).
-- If you host on a platform with its own scheduler (e.g. Vercel Cron), you can
-- instead hit POST /api/cleanup and skip this file.
--
-- This runs hourly and deletes any event whose expires_at has passed.

create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Remove a previous schedule with the same name if it exists.
    perform cron.unschedule(jobid)
      from cron.job
      where jobname = 'open-mic-night-cleanup';

    perform cron.schedule(
      'open-mic-night-cleanup',
      '0 * * * *',
      $cron$ select public.delete_expired_events(); $cron$
    );
  end if;
end;
$$;
