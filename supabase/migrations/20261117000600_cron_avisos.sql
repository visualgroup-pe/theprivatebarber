-- The Private Barber · tarea de avisos cada hora desde Supabase
-- Mientras el proyecto de Vercel esté en el plan Hobby (tareas solo diarias),
-- pg_cron llama cada hora a /api/cron/avisos con pg_net: recordatorio 24 h
-- antes y alerta a la administración si el barbero no responde.
--
-- La URL y el secreto se guardan en Supabase Vault (no en el código):
--   avisos_url      → https://<dominio>/api/cron/avisos
--   avisos_secreto  → el mismo valor que CRON_SECRET en Vercel
-- Sin esos secretos la llamada responde 401 y no hace nada.
--
-- Solo se aplica donde existen pg_cron y pg_net (Supabase); en el Postgres
-- local de las pruebas se omite.

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron o pg_net no disponibles: se omite la tarea de avisos';
    return;
  end if;

  create extension if not exists pg_cron;
  create extension if not exists pg_net with schema extensions;

  -- Reprogramar sin duplicar si la migración se vuelve a aplicar.
  perform cron.unschedule(jobid) from cron.job where jobname = 'avisos-cada-hora';

  perform cron.schedule(
    'avisos-cada-hora',
    '0 * * * *',
    $tarea$
      select net.http_get(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'avisos_url'),
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'avisos_secreto'), '')
        ),
        timeout_milliseconds := 30000
      )
      where exists (select 1 from vault.decrypted_secrets where name = 'avisos_url');
    $tarea$
  );
end
$$;
