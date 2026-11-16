-- The Private Barber · semillas (BRIEF · Carta de servicios, Barberos y horarios, Zonas)
-- Textos copiados del lienzo. Se puede volver a ejecutar sin duplicar.

-- ── Servicios ─────────────────────────────────────────────────────
insert into public.servicios
  (slug, nombre, descripcion, descripcion_corta, duracion_texto, precio_pen, duracion_min, duracion_max, es_adicional, orden)
values
  ('corte-a-medida', 'Corte a medida', 'Conversación previa, corte, lavado y peinado.',
   'Conversación, corte, lavado y peinado', '45 min – 1 h', 200, 45, 60, false, 1),
  ('barba-y-perfilado', 'Barba y perfilado', 'Diseño de la línea, toalla caliente y navaja.',
   'Línea, toalla caliente y navaja', '45 min – 1 h', 100, 45, 60, false, 2),
  ('corte-y-barba', 'Corte y barba', 'El servicio completo, pensado como un conjunto.',
   'El servicio completo', '45 min – 1 h', 300, 45, 60, false, 3),
  ('asesoria-de-imagen', 'Asesoría de imagen',
   'Un plan personal de imagen que el barbero te propone y explica durante la atención.',
   'Un plan personal que el barbero te propone durante la atención', 'Se suma a tu cita', 50, null, null, true, 4)
on conflict (slug) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  descripcion_corta = excluded.descripcion_corta,
  duracion_texto = excluded.duracion_texto,
  precio_pen = excluded.precio_pen,
  duracion_min = excluded.duracion_min,
  duracion_max = excluded.duracion_max,
  es_adicional = excluded.es_adicional,
  orden = excluded.orden;

-- ── Zonas ─────────────────────────────────────────────────────────
insert into public.zonas (distrito, orden) values
  ('San Isidro', 1),
  ('Miraflores', 2),
  ('Santiago de Surco', 3),
  ('San Borja', 4),
  ('La Molina', 5)
on conflict (distrito) do update set orden = excluded.orden;

-- ── Barberos ──────────────────────────────────────────────────────
-- Pendientes (BRIEF): especialidad de Nilber; nombre, foto y especialidad del
-- segundo barbero; foto real de Nilber. WhatsApp de cada barbero: lo carga la
-- administración en el panel.
insert into public.barberos (id, slug, nombre, foto_url, anos_oficio, especialidad, orden) values
  ('5b1a7c3e-0001-4000-8000-000000000001', 'nilber', 'Nilber', '/img/nilber.jpg', 5, null, 1),
  ('5b1a7c3e-0002-4000-8000-000000000002', 'segundo-barbero', '[Nombre]', null, 5, null, 2)
on conflict (slug) do update set
  nombre = excluded.nombre,
  foto_url = excluded.foto_url,
  anos_oficio = excluded.anos_oficio,
  orden = excluded.orden;

-- ── Horarios (ISO: 1 = lunes … 7 = domingo) ───────────────────────
-- Nilber: jueves. El brief no fija su hora: se usa la de la web, 9:00–21:00.
-- Segundo barbero: lunes a sábado, 9:00–21:00.
insert into public.horarios (barbero_id, dia_semana, hora_inicio, hora_fin)
select b.id, d.dia, time '09:00', time '21:00'
from public.barberos b
cross join lateral (
  select unnest(case b.slug when 'nilber' then array[4] else array[1, 2, 3, 4, 5, 6] end) as dia
) d
where b.slug in ('nilber', 'segundo-barbero')
on conflict (barbero_id, dia_semana, hora_inicio) do nothing;
