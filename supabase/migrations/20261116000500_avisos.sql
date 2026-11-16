-- The Private Barber · avisos por WhatsApp y correo
-- Registro de cada aviso (para revisar entregas y fallos) y marcas en la
-- cita para no repetir el recordatorio ni la alerta a la administración.

alter table public.citas
  add column recordatorio_enviado_en timestamptz,
  add column alerta_admin_enviada_en timestamptz;

comment on column public.citas.recordatorio_enviado_en is 'Recordatorio de 24 h enviado al cliente.';
comment on column public.citas.alerta_admin_enviada_en is 'Alerta a la administración: el barbero no respondió a tiempo.';

create table public.avisos (
  id bigint generated always as identity primary key,
  cita_id uuid references public.citas (id) on delete set null,
  reclamacion_id uuid references public.reclamaciones (id) on delete set null,
  canal text not null check (canal in ('whatsapp', 'correo')),
  destinatario text not null,
  plantilla text not null,
  estado text not null check (estado in ('enviado', 'omitido', 'fallido', 'entregado', 'leido')),
  proveedor_id text,
  error text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on table public.avisos is 'Cada aviso enviado (o omitido por falta de configuración) con su resultado.';
create index avisos_cita on public.avisos (cita_id);
create index avisos_reclamacion on public.avisos (reclamacion_id);
create index avisos_proveedor on public.avisos (proveedor_id) where proveedor_id is not null;

-- Las citas por recordar y por alertar se buscan por estado y fecha.
create index citas_por_recordar on public.citas (fecha) where estado = 'confirmada' and recordatorio_enviado_en is null;

alter table public.avisos enable row level security;
revoke all on public.avisos from anon, authenticated;
grant all on public.avisos to service_role;
grant select on public.avisos to authenticated;

create policy "avisos: admin lee"
on public.avisos for select to authenticated
using ((select privado.es_admin()));
