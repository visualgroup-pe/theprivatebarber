-- The Private Barber · v1 · seguridad (RLS y permisos)
-- Roles de Supabase: anon (visitante), authenticated (usuario del panel),
-- service_role (servidor: ruta /api/solicitudes y avisos; ignora RLS).
--
-- Reglas del brief:
-- · El público solo crea citas y clientes a través de la ruta de API (service_role), nunca directo.
-- · Un barbero solo lee y cambia las citas asignadas a él.
-- · El rol admin lo ve todo. Cada cambio de estado escribe una fila en cita_eventos (triggers).

-- ── Punto de partida: sin permisos ────────────────────────────────
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter table public.perfiles enable row level security;
alter table public.servicios enable row level security;
alter table public.barberos enable row level security;
alter table public.horarios enable row level security;
alter table public.zonas enable row level security;
alter table public.clientes enable row level security;
alter table public.citas enable row level security;
alter table public.cita_eventos enable row level security;
alter table public.correlativos enable row level security;
alter table public.reclamaciones enable row level security;

-- Funciones que usan las políticas y la web
grant execute on function
  public.es_admin(),
  public.barbero_actual(),
  public.hoy_lima(),
  public.franja_inicio(public.franja),
  public.franja_fin(public.franja),
  public.hora_en_franja(time, public.franja),
  public.barbero_atiende(uuid, date, public.franja),
  public.transicion_valida(public.estado_cita, public.estado_cita),
  public.transicion_de_barbero(public.estado_cita, public.estado_cita)
to anon, authenticated;

-- crear_solicitud: el servidor (service_role) o la administración (comprueba es_admin dentro).
grant execute on function public.crear_solicitud(
  text, text, text, boolean, boolean, uuid, uuid, boolean, uuid, text,
  public.lugar_atencion, text, text, date, public.franja, public.origen_cita
) to authenticated;
-- cambiar_estado_cita: barbero o admin; RLS decide sobre qué citas.
grant execute on function public.cambiar_estado_cita(
  uuid, public.estado_cita, text, time, date, public.franja, time
) to authenticated;

-- ── Perfiles ──────────────────────────────────────────────────────
grant select on public.perfiles to authenticated;
grant insert, update, delete on public.perfiles to authenticated;

create policy "perfiles: cada uno ve el suyo; admin ve todos"
on public.perfiles for select to authenticated
using (id = (select auth.uid()) or (select public.es_admin()));

create policy "perfiles: admin gestiona"
on public.perfiles for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

-- ── Catálogo: lectura pública de lo activo; admin gestiona ────────
grant select on public.servicios, public.zonas, public.horarios to anon, authenticated;
grant insert, update, delete on public.servicios, public.zonas, public.horarios to authenticated;

create policy "servicios: públicos si están activos"
on public.servicios for select to anon, authenticated
using (activo or (select public.es_admin()));
create policy "servicios: admin gestiona"
on public.servicios for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "zonas: públicas si están activas"
on public.zonas for select to anon, authenticated
using (activo or (select public.es_admin()));
create policy "zonas: admin gestiona"
on public.zonas for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy "horarios: públicos los de barberos activos"
on public.horarios for select to anon, authenticated
using (
  (select public.es_admin())
  or exists (select 1 from public.barberos b where b.id = barbero_id and b.activo)
);
create policy "horarios: admin gestiona"
on public.horarios for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

-- Barberos: el público ve solo columnas de presentación (sin WhatsApp ni user_id).
grant select (id, slug, nombre, foto_url, anos_oficio, especialidad, activo, orden) on public.barberos to anon;
grant select on public.barberos to authenticated;
grant insert, update, delete on public.barberos to authenticated;

create policy "barberos: el público ve los activos"
on public.barberos for select to anon
using (activo);
create policy "barberos: el barbero se ve a sí mismo; admin ve todos"
on public.barberos for select to authenticated
using (user_id = (select auth.uid()) or (select public.es_admin()));
create policy "barberos: admin gestiona"
on public.barberos for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

-- ── Clientes ──────────────────────────────────────────────────────
grant select, insert, update, delete on public.clientes to authenticated;

create policy "clientes: admin ve todos; el barbero, los de sus citas"
on public.clientes for select to authenticated
using (
  (select public.es_admin())
  or exists (
    select 1 from public.citas c
    where c.cliente_id = clientes.id and c.barbero_id = (select public.barbero_actual())
  )
);
create policy "clientes: admin gestiona"
on public.clientes for all to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

-- ── Citas ─────────────────────────────────────────────────────────
grant select, insert, update, delete on public.citas to authenticated;

create policy "citas: admin ve todas; el barbero, las suyas"
on public.citas for select to authenticated
using ((select public.es_admin()) or barbero_id = (select public.barbero_actual()));

create policy "citas: admin o el barbero asignado las cambia"
on public.citas for update to authenticated
using ((select public.es_admin()) or barbero_id = (select public.barbero_actual()))
with check ((select public.es_admin()) or barbero_id = (select public.barbero_actual()));

create policy "citas: solo admin las crea a mano"
on public.citas for insert to authenticated
with check ((select public.es_admin()));

create policy "citas: solo admin las borra"
on public.citas for delete to authenticated
using ((select public.es_admin()));

-- ── Historial: solo lectura (lo escriben los triggers) ─────────────
grant select on public.cita_eventos to authenticated;

create policy "cita_eventos: admin ve todo; el barbero, el de sus citas"
on public.cita_eventos for select to authenticated
using (
  (select public.es_admin())
  or exists (
    select 1 from public.citas c
    where c.id = cita_id and c.barbero_id = (select public.barbero_actual())
  )
);

-- ── Libro de Reclamaciones: lo crea el servidor; admin lee y responde ──
grant select on public.reclamaciones to authenticated;
grant update (respuesta, respondido_en) on public.reclamaciones to authenticated;

create policy "reclamaciones: admin lee"
on public.reclamaciones for select to authenticated
using ((select public.es_admin()));
create policy "reclamaciones: admin responde"
on public.reclamaciones for update to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

-- correlativos: sin acceso salvo service_role y el trigger (security definer).
