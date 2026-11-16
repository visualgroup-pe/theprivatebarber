-- Solo para pruebas locales sin Docker: imita lo mínimo de Supabase que usan
-- las migraciones (roles anon/authenticated/service_role, esquema auth,
-- auth.uid() y auth.users). En Supabase real esto ya existe: no se aplica.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key,
  email text unique
);

-- Igual que en Supabase: lee el usuario del JWT que PostgREST deja en request.jwt.claims.
create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    ),
    ''
  )::uuid
$$;

create function auth.role() returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$$;

grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
