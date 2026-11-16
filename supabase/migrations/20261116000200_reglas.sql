-- The Private Barber · v1 · reglas del negocio
-- Las reglas viven en la base de datos para que valgan igual desde la web,
-- el panel del barbero, el de administración o una carga manual.
-- Los errores se lanzan con un código corto en el mensaje (p. ej. «sin_horario»)
-- que la app traduce a texto para el cliente.

-- ── Utilidades ─────────────────────────────────────────────────────

create function public.hoy_lima()
returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'America/Lima')::date $$;

create function public.franja_inicio(f public.franja)
returns time
language sql immutable
set search_path = ''
as $$
  select case f
    when 'manana' then time '09:00'
    when 'mediodia' then time '12:00'
    when 'tarde' then time '15:00'
    when 'noche' then time '18:00'
  end
$$;

create function public.franja_fin(f public.franja)
returns time
language sql immutable
set search_path = ''
as $$ select public.franja_inicio(f) + interval '3 hours' $$;

/** ¿El barbero (activo) tiene horario ese día que cubra toda la franja? */
create function public.barbero_atiende(p_barbero uuid, p_fecha date, p_franja public.franja)
returns boolean
language sql stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.horarios h
    join public.barberos b on b.id = h.barbero_id
    where b.id = p_barbero
      and b.activo
      and h.dia_semana = extract(isodow from p_fecha)
      and h.hora_inicio <= public.franja_inicio(p_franja)
      and h.hora_fin >= public.franja_fin(p_franja)
  )
$$;

/** La hora exacta debe caer dentro de la franja: inicio <= hora < fin. */
create function public.hora_en_franja(p_hora time, p_franja public.franja)
returns boolean
language sql immutable
set search_path = ''
as $$ select p_hora >= public.franja_inicio(p_franja) and p_hora < public.franja_fin(p_franja) $$;

-- ── Roles ──────────────────────────────────────────────────────────
-- security definer: se usan dentro de las políticas RLS sin abrir las tablas.

create function public.es_admin()
returns boolean
language sql stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin') $$;

create function public.barbero_actual()
returns uuid
language sql stable
security definer
set search_path = ''
as $$
  select b.id
  from public.barberos b
  join public.perfiles p on p.id = b.user_id and p.rol = 'barber'
  where b.user_id = auth.uid()
$$;

/** Quién hace el cambio, para cita_eventos. Sin usuario: la web (cliente) o el sistema. */
create function public.actor_actual()
returns text
language sql stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then
      case when current_setting('tpb.actor', true) = 'cliente' then 'cliente' else 'sistema' end
    when public.es_admin() then 'admin'
    when public.barbero_actual() is not null then 'barber'
    else 'sistema'
  end
$$;

-- ── Transiciones de estado (diagrama del brief) ────────────────────
--   solicitud_recibida → pendiente → ¿acepta? → confirmada | rechazada | reprogramacion
--   reprogramacion → confirmada (el cliente acepta) | cancelada (no acepta)
--   confirmada → completada | cancelada
-- Además: una solicitud aún sin respuesta puede cancelarse.

create function public.transicion_valida(de public.estado_cita, a public.estado_cita)
returns boolean
language sql immutable
set search_path = ''
as $$
  select (de, a) in (
    ('solicitud_recibida', 'pendiente'),
    ('solicitud_recibida', 'confirmada'),
    ('solicitud_recibida', 'rechazada'),
    ('solicitud_recibida', 'reprogramacion'),
    ('solicitud_recibida', 'cancelada'),
    ('pendiente', 'confirmada'),
    ('pendiente', 'rechazada'),
    ('pendiente', 'reprogramacion'),
    ('pendiente', 'cancelada'),
    ('reprogramacion', 'confirmada'),
    ('reprogramacion', 'cancelada'),
    ('confirmada', 'completada'),
    ('confirmada', 'cancelada')
  )
$$;

/** Lo que decide el barbero. Aceptar el nuevo horario o cancelar es del cliente (vía admin o sistema). */
create function public.transicion_de_barbero(de public.estado_cita, a public.estado_cita)
returns boolean
language sql immutable
set search_path = ''
as $$
  select (de, a) in (
    ('solicitud_recibida', 'pendiente'),
    ('solicitud_recibida', 'confirmada'),
    ('solicitud_recibida', 'rechazada'),
    ('solicitud_recibida', 'reprogramacion'),
    ('pendiente', 'confirmada'),
    ('pendiente', 'rechazada'),
    ('pendiente', 'reprogramacion'),
    ('confirmada', 'completada')
  )
$$;

-- ── Citas: al crear ────────────────────────────────────────────────

create function public.citas_antes_de_crear()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_servicio public.servicios;
  v_asesoria integer;
begin
  -- Toda cita nace como solicitud: el cliente no recibe confirmación hasta que el barbero acepta.
  new.estado := 'solicitud_recibida';
  new.hora_confirmada := null;
  new.motivo := null;
  new.propuesta_fecha := null;
  new.propuesta_franja := null;
  new.propuesta_hora := null;
  new.creado_en := now();
  new.actualizado_en := now();

  -- Servicio principal activo; el precio se copia de la carta.
  select * into v_servicio from public.servicios where id = new.servicio_id;
  if not found or not v_servicio.activo then
    raise exception 'servicio_no_disponible';
  end if;
  if v_servicio.es_adicional then
    raise exception 'servicio_debe_ser_principal'
      using detail = 'La asesoría solo se pide junto a un servicio principal.';
  end if;
  new.precio_servicio_pen := v_servicio.precio_pen;

  if new.con_asesoria then
    select precio_pen into v_asesoria
    from public.servicios where es_adicional and activo order by orden limit 1;
    if v_asesoria is null then
      raise exception 'asesoria_no_disponible';
    end if;
    new.precio_asesoria_pen := v_asesoria;
  else
    new.precio_asesoria_pen := 0;
  end if;

  -- Zona activa, u «otro distrito» (queda marcada para revisión).
  if new.zona_id is not null then
    new.distrito_otro := null;
    if not exists (select 1 from public.zonas where id = new.zona_id and activo) then
      raise exception 'zona_no_disponible';
    end if;
  end if;

  if new.fecha < public.hoy_lima() then
    raise exception 'fecha_pasada';
  end if;

  if not public.barbero_atiende(new.barbero_id, new.fecha, new.franja) then
    raise exception 'sin_horario'
      using detail = 'El barbero no atiende ese día o en esa franja.';
  end if;

  return new;
end;
$$;

create trigger citas_antes_de_crear
before insert on public.citas
for each row execute function public.citas_antes_de_crear();

create function public.citas_despues_de_crear()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cita_eventos (cita_id, estado_anterior, estado_nuevo, actor_id, actor, nota)
  values (
    new.id, null, new.estado, auth.uid(), public.actor_actual(),
    coalesce(
      nullif(current_setting('tpb.nota', true), ''),
      case when new.revision_zona then 'Otro distrito: ' || new.distrito_otro || '. Revisar zona.' end
    )
  );
  return new;
end;
$$;

create trigger citas_despues_de_crear
after insert on public.citas
for each row execute function public.citas_despues_de_crear();

-- ── Citas: al cambiar ──────────────────────────────────────────────

create function public.citas_antes_de_cambiar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_admin boolean := public.es_admin();
  v_usuario boolean := auth.uid() is not null;
  -- Lo único que un barbero puede tocar. Las columnas generadas (revision_zona,
  -- precio_total_pen) no están calculadas aún en un BEFORE trigger: se excluyen
  -- y quedan cubiertas por las columnas de las que dependen.
  v_libres text[] := array[
    'estado', 'hora_confirmada', 'motivo', 'propuesta_fecha', 'propuesta_franja', 'propuesta_hora',
    'actualizado_en', 'revision_zona', 'precio_total_pen'
  ];
  v_asesoria integer;
begin
  -- Columnas calculadas o de auditoría: nadie las cambia a mano.
  new.creado_en := old.creado_en;
  new.actualizado_en := now();

  if v_usuario and not v_admin then
    if (to_jsonb(new) - v_libres) is distinct from (to_jsonb(old) - v_libres) then
      raise exception 'campos_no_permitidos'
        using detail = 'El barbero solo puede cambiar el estado, la hora y la propuesta de horario.';
    end if;
  end if;

  -- Si la administración cambia el servicio o la asesoría, el precio se recalcula con la carta vigente.
  if (new.servicio_id, new.con_asesoria) is distinct from (old.servicio_id, old.con_asesoria) then
    select precio_pen into new.precio_servicio_pen
    from public.servicios where id = new.servicio_id and activo and not es_adicional;
    if new.precio_servicio_pen is null then
      raise exception 'servicio_debe_ser_principal';
    end if;
    if new.con_asesoria then
      select precio_pen into v_asesoria from public.servicios where es_adicional and activo order by orden limit 1;
      new.precio_asesoria_pen := coalesce(v_asesoria, 0);
    else
      new.precio_asesoria_pen := 0;
    end if;
  elsif (new.precio_servicio_pen, new.precio_asesoria_pen) is distinct from (old.precio_servicio_pen, old.precio_asesoria_pen)
        and v_usuario and not v_admin then
    raise exception 'campos_no_permitidos';
  end if;

  if new.estado is distinct from old.estado then
    if not public.transicion_valida(old.estado, new.estado) then
      raise exception 'transicion_invalida'
        using detail = format('No se puede pasar de %s a %s.', old.estado, new.estado);
    end if;
    if v_usuario and not v_admin and not public.transicion_de_barbero(old.estado, new.estado) then
      raise exception 'transicion_no_permitida'
        using detail = format('El barbero no puede pasar de %s a %s.', old.estado, new.estado);
    end if;

    -- El cliente acepta el horario propuesto: pasa a ser el de la cita.
    if old.estado = 'reprogramacion' and new.estado = 'confirmada' then
      new.fecha := old.propuesta_fecha;
      new.franja := old.propuesta_franja;
      new.hora_confirmada := old.propuesta_hora;
    end if;

    -- El barbero propone otro horario: debe tener horario ese día y no estar en el pasado.
    if new.estado = 'reprogramacion' then
      if new.propuesta_fecha is null or new.propuesta_franja is null or new.propuesta_hora is null then
        raise exception 'falta_propuesta';
      end if;
      if new.propuesta_fecha < public.hoy_lima() then
        raise exception 'fecha_pasada';
      end if;
      if not public.hora_en_franja(new.propuesta_hora, new.propuesta_franja) then
        raise exception 'hora_fuera_de_franja';
      end if;
      if not public.barbero_atiende(new.barbero_id, new.propuesta_fecha, new.propuesta_franja) then
        raise exception 'sin_horario';
      end if;
    end if;

    -- Al aceptar, el barbero fija la hora exacta dentro de la franja.
    if new.estado = 'confirmada' then
      if new.hora_confirmada is null then
        raise exception 'falta_hora';
      end if;
      new.propuesta_fecha := null;
      new.propuesta_franja := null;
      new.propuesta_hora := null;
    end if;
  end if;

  if new.hora_confirmada is not null
     and new.hora_confirmada is distinct from old.hora_confirmada
     and not public.hora_en_franja(new.hora_confirmada, new.franja) then
    raise exception 'hora_fuera_de_franja';
  end if;

  -- Si la administración mueve la cita (día, franja o barbero), el barbero debe atender ese día.
  if (new.fecha, new.franja, new.barbero_id) is distinct from (old.fecha, old.franja, old.barbero_id)
     and new.estado not in ('rechazada', 'cancelada', 'completada')
     and not public.barbero_atiende(new.barbero_id, new.fecha, new.franja) then
    raise exception 'sin_horario';
  end if;

  return new;
end;
$$;

create trigger citas_antes_de_cambiar
before update on public.citas
for each row execute function public.citas_antes_de_cambiar();

create function public.citas_despues_de_cambiar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.estado is distinct from old.estado then
    insert into public.cita_eventos (cita_id, estado_anterior, estado_nuevo, actor_id, actor, nota)
    values (
      new.id, old.estado, new.estado, auth.uid(), public.actor_actual(),
      coalesce(
        nullif(current_setting('tpb.nota', true), ''),
        case
          when new.estado = 'reprogramacion' then
            format('Propone %s, %s', to_char(new.propuesta_fecha, 'DD/MM/YYYY'), to_char(new.propuesta_hora, 'HH24:MI'))
          when new.estado = 'confirmada' then
            format('Hora: %s', to_char(new.hora_confirmada, 'HH24:MI'))
          when new.estado in ('rechazada', 'cancelada') then new.motivo
        end
      )
    );
  end if;
  return new;
end;
$$;

create trigger citas_despues_de_cambiar
after update on public.citas
for each row execute function public.citas_despues_de_cambiar();

-- ── Funciones para la app ──────────────────────────────────────────

/**
 * Crea una solicitud: guarda o actualiza el cliente (por WhatsApp) y crea la cita.
 * La llama la ruta /api/solicitudes con la clave de servicio, o la administración
 * para registrar a mano una solicitud llegada por WhatsApp.
 */
create function public.crear_solicitud(
  p_nombre text,
  p_whatsapp text,
  p_correo text,
  p_consentimiento_datos boolean,
  p_consentimiento_marketing boolean,
  p_barbero uuid,
  p_servicio uuid,
  p_con_asesoria boolean,
  p_zona uuid,
  p_distrito_otro text,
  p_lugar public.lugar_atencion,
  p_direccion text,
  p_referencia text,
  p_fecha date,
  p_franja public.franja,
  p_origen public.origen_cita default 'web'
)
returns public.citas
language plpgsql
set search_path = ''
as $$
declare
  v_cliente uuid;
  v_cita public.citas;
begin
  if auth.uid() is not null and not public.es_admin() then
    raise exception 'sin_permiso';
  end if;
  if not coalesce(p_consentimiento_datos, false) then
    raise exception 'falta_consentimiento';
  end if;
  if auth.uid() is null then
    perform set_config('tpb.actor', 'cliente', true);
  end if;

  insert into public.clientes as c (nombre, whatsapp, correo, consentimiento_datos, consentimiento_marketing)
  values (trim(p_nombre), p_whatsapp, nullif(trim(coalesce(p_correo, '')), ''), true, coalesce(p_consentimiento_marketing, false))
  on conflict (whatsapp) do update set
    nombre = excluded.nombre,
    correo = coalesce(excluded.correo, c.correo),
    consentimiento_marketing = excluded.consentimiento_marketing,
    consentimiento_en = now(),
    actualizado_en = now()
  returning id into v_cliente;

  insert into public.citas (
    cliente_id, barbero_id, servicio_id, con_asesoria, zona_id, distrito_otro,
    lugar, direccion, referencia, fecha, franja, origen
  ) values (
    v_cliente, p_barbero, p_servicio, coalesce(p_con_asesoria, false), p_zona, nullif(trim(coalesce(p_distrito_otro, '')), ''),
    p_lugar, nullif(trim(coalesce(p_direccion, '')), ''), nullif(trim(coalesce(p_referencia, '')), ''), p_fecha, p_franja,
    coalesce(p_origen, 'web')
  )
  returning * into v_cita;

  return v_cita;
end;
$$;

/**
 * Cambia el estado de una cita con una nota para el historial.
 * security invoker: las políticas RLS deciden si el usuario puede tocar esa cita.
 */
create function public.cambiar_estado_cita(
  p_cita uuid,
  p_estado public.estado_cita,
  p_nota text default null,
  p_hora time default null,
  p_propuesta_fecha date default null,
  p_propuesta_franja public.franja default null,
  p_propuesta_hora time default null
)
returns public.citas
language plpgsql
set search_path = ''
as $$
declare
  v_cita public.citas;
begin
  perform set_config('tpb.nota', coalesce(p_nota, ''), true);

  update public.citas set
    estado = p_estado,
    hora_confirmada = case when p_estado = 'confirmada' and p_hora is not null then p_hora else hora_confirmada end,
    motivo = case when p_estado in ('rechazada', 'cancelada') then p_nota else motivo end,
    propuesta_fecha = case when p_estado = 'reprogramacion' then p_propuesta_fecha else propuesta_fecha end,
    propuesta_franja = case when p_estado = 'reprogramacion' then p_propuesta_franja else propuesta_franja end,
    propuesta_hora = case when p_estado = 'reprogramacion' then p_propuesta_hora else propuesta_hora end
  where id = p_cita
  returning * into v_cita;

  if not found then
    raise exception 'cita_no_encontrada';
  end if;
  perform set_config('tpb.nota', '', true);
  return v_cita;
end;
$$;

-- ── Clientes: fecha de actualización ───────────────────────────────

create function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger clientes_actualizado_en
before update on public.clientes
for each row execute function public.tocar_actualizado_en();

-- ── Libro de Reclamaciones: número correlativo por año ─────────────

create function public.reclamaciones_numerar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.anio := extract(year from (now() at time zone 'America/Lima'))::integer;
  insert into public.correlativos as c (anio, ultimo) values (new.anio, 1)
  on conflict (anio) do update set ultimo = c.ultimo + 1
  returning ultimo into new.numero;
  new.creado_en := now();
  return new;
end;
$$;

create trigger reclamaciones_numerar
before insert on public.reclamaciones
for each row execute function public.reclamaciones_numerar();
