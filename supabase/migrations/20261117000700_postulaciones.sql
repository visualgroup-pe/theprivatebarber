-- The Private Barber · convocatoria de barberos
-- Postulaciones desde /convocatoria. Las crea el servidor (service_role) tras
-- validar el formulario; solo la administración las lee y las gestiona.
-- Las fotos de trabajos van a Storage (bucket privado «postulaciones»), en la
-- carpeta <id de la postulación>/.

create type public.estado_postulacion as enum (
  'nueva', 'en_revision', 'entrevista', 'prueba', 'aprobada', 'descartada'
);

create table public.postulaciones (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  -- Datos personales
  nombre text not null check (char_length(btrim(nombre)) between 3 and 120),
  tipo_documento text not null check (tipo_documento in ('DNI', 'CE')),
  numero_documento text not null check (numero_documento ~ '^[A-Za-z0-9]{5,20}$'),
  whatsapp text not null check (whatsapp ~ '^9[0-9]{8}$'),
  correo text check (correo is null or correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  distrito_residencia text not null check (char_length(btrim(distrito_residencia)) between 2 and 80),

  -- Oficio
  anos_oficio smallint not null check (anos_oficio between 0 and 60),
  tecnicas text[] not null default '{}'
    check (tecnicas <@ array['tijera', 'maquina', 'navaja', 'toalla_caliente']),
  especialidad text check (especialidad is null or char_length(especialidad) <= 160),
  experiencia text not null check (char_length(btrim(experiencia)) between 20 and 2000),
  experiencia_domicilio boolean not null default false,
  instagram text check (instagram is null or char_length(instagram) <= 200),
  fotos text[] not null default '{}' check (cardinality(fotos) <= 6),

  -- Disponibilidad
  dias smallint[] not null check (cardinality(dias) > 0 and dias <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  franjas text[] not null check (cardinality(franjas) > 0 and franjas <@ array['manana', 'mediodia', 'tarde', 'noche']),
  zonas text[] not null default '{}',
  movilidad text not null check (movilidad in ('auto', 'moto', 'transporte')),

  -- Compromisos y consentimiento
  herramientas_propias boolean not null,
  compromiso_higiene boolean not null,
  compromiso_puntualidad boolean not null,
  mensaje text check (mensaje is null or char_length(mensaje) <= 2000),
  consentimiento_datos boolean not null check (consentimiento_datos),

  -- Evaluación automática contra los requisitos publicados (lib/convocatoria.ts)
  cumple_requisitos boolean not null,
  requisitos_faltantes text[] not null default '{}',

  -- Gestión
  estado public.estado_postulacion not null default 'nueva',
  notas text check (notas is null or char_length(notas) <= 4000),
  barbero_id uuid references public.barberos (id) on delete set null
);

comment on table public.postulaciones is 'Postulaciones de barberos desde /convocatoria. Solo admin.';
comment on column public.postulaciones.fotos is 'Rutas en el bucket privado «postulaciones» (<id>/<n>.jpg).';
comment on column public.postulaciones.cumple_requisitos is 'Calculado al postular según los requisitos publicados.';
comment on column public.postulaciones.barbero_id is 'Ficha de barbero creada a partir de esta postulación.';

create index postulaciones_recientes on public.postulaciones (creado_en desc);
create index postulaciones_barbero on public.postulaciones (barbero_id) where barbero_id is not null;

create trigger postulaciones_actualizado_en
before update on public.postulaciones
for each row execute function public.tocar_actualizado_en();

-- Avisos de una postulación (correo a la administración y al postulante).
alter table public.avisos
  add column postulacion_id uuid references public.postulaciones (id) on delete set null;
create index avisos_postulacion on public.avisos (postulacion_id);

-- ── Permisos ──────────────────────────────────────────────────────
alter table public.postulaciones enable row level security;
revoke all on public.postulaciones from anon, authenticated;
grant all on public.postulaciones to service_role;
grant select, update, delete on public.postulaciones to authenticated;

create policy "postulaciones: admin lee"
on public.postulaciones for select to authenticated
using ((select privado.es_admin()));

create policy "postulaciones: admin gestiona"
on public.postulaciones for update to authenticated
using ((select privado.es_admin()))
with check ((select privado.es_admin()));

create policy "postulaciones: admin borra"
on public.postulaciones for delete to authenticated
using ((select privado.es_admin()));

-- ── Fotos (Supabase Storage) ──────────────────────────────────────
-- Bucket privado: el postulante sube con una URL firmada que entrega el
-- servidor; la administración las ve con URLs firmadas de corta duración.
-- En el Postgres local de las pruebas no existe Storage: se omite.
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'Storage no disponible: se omite el bucket de postulaciones';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('postulaciones', 'postulaciones', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  execute $p$
    create policy "postulaciones: admin ve fotos"
    on storage.objects for select to authenticated
    using (bucket_id = 'postulaciones' and (select privado.es_admin()))
  $p$;
  execute $p$
    create policy "postulaciones: admin borra fotos"
    on storage.objects for delete to authenticated
    using (bucket_id = 'postulaciones' and (select privado.es_admin()))
  $p$;
end
$$;
