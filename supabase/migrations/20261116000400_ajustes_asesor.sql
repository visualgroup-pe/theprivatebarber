-- The Private Barber · ajustes según el asesor de Supabase (security + performance)

-- 1) Las funciones de rol security definer no deben quedar expuestas por la API
--    (/rest/v1/rpc). Se mueven a un esquema privado que PostgREST no publica.
--    Las políticas RLS las referencian por OID y siguen funcionando; en public
--    queda un envoltorio security invoker para las funciones que las llaman por nombre.
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to anon, authenticated, service_role;

alter function public.es_admin() set schema privado;
alter function public.barbero_actual() set schema privado;
alter function public.actor_actual() set schema privado;

grant execute on function privado.es_admin(), privado.barbero_actual() to anon, authenticated, service_role;
grant execute on function privado.actor_actual() to service_role;

create function public.es_admin()
returns boolean
language sql stable
security invoker
set search_path = ''
as $$ select privado.es_admin() $$;

create function public.barbero_actual()
returns uuid
language sql stable
security invoker
set search_path = ''
as $$ select privado.barbero_actual() $$;

create function public.actor_actual()
returns text
language sql stable
security invoker
set search_path = ''
as $$ select privado.actor_actual() $$;

revoke execute on function public.es_admin(), public.barbero_actual(), public.actor_actual() from public;
grant execute on function public.es_admin(), public.barbero_actual() to anon, authenticated, service_role;
grant execute on function public.actor_actual() to service_role;
-- Los triggers que anotan el historial (security definer) llaman a public.actor_actual().

-- 2) Una sola política permisiva por rol y acción: «admin gestiona» deja de
--    cubrir SELECT (la política de lectura ya incluye al admin).
do $$
declare
  t text;
begin
  foreach t in array array['perfiles', 'servicios', 'zonas', 'horarios', 'barberos', 'clientes'] loop
    execute format('drop policy %I on public.%I', t || ': admin gestiona', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select privado.es_admin()))',
      t || ': admin crea', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select privado.es_admin())) with check ((select privado.es_admin()))',
      t || ': admin cambia', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select privado.es_admin()))',
      t || ': admin borra', t);
  end loop;
end $$;

-- 3) Índices para las claves foráneas sin índice.
create index if not exists citas_servicio on public.citas (servicio_id);
create index if not exists citas_zona on public.citas (zona_id);
create index if not exists cita_eventos_actor on public.cita_eventos (actor_id);

comment on table public.correlativos is
  'Último número de hoja de reclamación por año. Sin políticas a propósito: solo el trigger (security definer) y service_role.';
