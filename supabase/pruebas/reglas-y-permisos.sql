-- Pruebas del esquema, las reglas y los permisos (RLS).
-- Se ejecutan con scripts/probar-db.sh sobre un Postgres local desechable.
-- Cada comprobación imprime «ok: …»; la primera que falla detiene todo.

\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null
set client_min_messages = notice;

-- ── Utilidades de prueba ──────────────────────────────────────────
create schema pruebas;
grant usage on schema pruebas to public;

create function pruebas.ok(condicion boolean, nombre text) returns void
language plpgsql as $$
begin
  if condicion is not true then
    raise exception 'FALLA: %', nombre;
  end if;
  raise notice 'ok: %', nombre;
end $$;

-- Ejecuta p_sql y exige que falle con un mensaje que contenga p_esperado.
create function pruebas.falla(p_sql text, p_esperado text, nombre text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(p_esperado in sqlerrm) = 0 then
      raise exception 'FALLA: % (esperaba «%», salió «%»)', nombre, p_esperado, sqlerrm;
    end if;
    raise notice 'ok: % → %', nombre, sqlerrm;
    return;
  end;
  raise exception 'FALLA: % (esperaba error «%», pero funcionó)', nombre, p_esperado;
end $$;

-- Actúa como un usuario del panel (lo que hace PostgREST con el JWT).
create function pruebas.como(p_usuario uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_usuario, 'role', 'authenticated')::text, false)
$$;
create function pruebas.sin_usuario() returns void
language sql as $$ select set_config('request.jwt.claims', '', false) $$;

grant execute on all functions in schema pruebas to public;

-- Fechas futuras por día de la semana (ISO), con una semana de margen.
select
  public.hoy_lima() + ((1 - extract(isodow from public.hoy_lima())::int + 7) % 7) + 7 as lunes,
  public.hoy_lima() + ((4 - extract(isodow from public.hoy_lima())::int + 7) % 7) + 7 as jueves,
  public.hoy_lima() + ((4 - extract(isodow from public.hoy_lima())::int + 7) % 7) + 14 as jueves2,
  public.hoy_lima() + ((7 - extract(isodow from public.hoy_lima())::int + 7) % 7) + 7 as domingo
\gset

select id as nilber from public.barberos where slug = 'nilber' \gset
select id as segundo from public.barberos where slug = 'segundo-barbero' \gset
select id as corte from public.servicios where slug = 'corte-a-medida' \gset
select id as corte_barba from public.servicios where slug = 'corte-y-barba' \gset
select id as asesoria from public.servicios where slug = 'asesoria-de-imagen' \gset
select id as san_isidro from public.zonas where distrito = 'San Isidro' \gset

\echo '── Semillas'
select pruebas.ok((select count(*) from public.servicios) = 4, '4 servicios');
select pruebas.ok((select count(*) from public.servicios where es_adicional) = 1, '1 adicional (asesoría)');
select pruebas.ok((select count(*) from public.zonas) = 5, '5 zonas');
select pruebas.ok((select count(*) from public.barberos) = 2, '2 barberos');
select pruebas.ok((select count(*) from public.horarios where barbero_id = :'nilber') = 1, 'Nilber: 1 día (jueves)');
select pruebas.ok((select count(*) from public.horarios where barbero_id = :'segundo') = 6, 'Segundo barbero: lunes a sábado');
select pruebas.ok(public.barbero_atiende(:'nilber', :'jueves', 'noche'), 'Nilber atiende jueves de noche');
select pruebas.ok(not public.barbero_atiende(:'nilber', :'lunes', 'manana'), 'Nilber no atiende lunes');
select pruebas.ok(not public.barbero_atiende(:'segundo', :'domingo', 'tarde'), 'Segundo barbero no atiende domingo');

\echo '── Usuarios del panel'
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-00000000000a', 'admin@ejemplo.pe'),
  ('b0000000-0000-4000-8000-00000000000b', 'nilber@ejemplo.pe'),
  ('c0000000-0000-4000-8000-00000000000c', 'segundo@ejemplo.pe'),
  ('d0000000-0000-4000-8000-00000000000d', 'sin-rol@ejemplo.pe');
insert into public.perfiles (id, rol, nombre) values
  ('a0000000-0000-4000-8000-00000000000a', 'admin', 'Administración'),
  ('b0000000-0000-4000-8000-00000000000b', 'barber', 'Nilber'),
  ('c0000000-0000-4000-8000-00000000000c', 'barber', 'Segundo');
update public.barberos set user_id = 'b0000000-0000-4000-8000-00000000000b', whatsapp = '911111111' where slug = 'nilber';
update public.barberos set user_id = 'c0000000-0000-4000-8000-00000000000c', whatsapp = '922222222' where slug = 'segundo-barbero';

\echo '── Visitante (anon)'
begin;
set local role anon;
select pruebas.ok((select count(*) from public.servicios) = 3, 'anon lee la carta activa (sin barba sola)');
select pruebas.ok((select count(*) from public.zonas) = 5, 'anon lee las zonas');
select pruebas.ok((select count(*) from public.horarios) = 7, 'anon lee los horarios');
select pruebas.ok((select count(*) from (select id, nombre, foto_url from public.barberos) b) = 2, 'anon lee nombre y foto de los barberos');
select pruebas.falla('select whatsapp from public.barberos', 'permission denied', 'anon no ve el WhatsApp de los barberos');
select pruebas.falla('select * from public.clientes', 'permission denied', 'anon no lee clientes');
select pruebas.falla('select * from public.citas', 'permission denied', 'anon no lee citas');
select pruebas.falla($$insert into public.clientes (nombre, whatsapp, consentimiento_datos) values ('X', '999999999', true)$$,
  'permission denied', 'anon no crea clientes directo');
select pruebas.falla(format($$insert into public.citas (cliente_id, barbero_id, servicio_id, zona_id, fecha, franja)
  values (gen_random_uuid(), %L, %L, %L, %L, 'tarde')$$, :'nilber', :'corte', :'san_isidro', :'jueves'),
  'permission denied', 'anon no crea citas directo');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '999999999', null, true, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'corte', :'san_isidro', :'jueves'), 'permission denied', 'anon no llama a crear_solicitud');
select pruebas.falla($$select * from public.reclamaciones$$, 'permission denied', 'anon no lee reclamaciones');
rollback;

\echo '── Servidor (service_role): ruta /api/solicitudes'
set role service_role;
select pruebas.sin_usuario();

select (public.crear_solicitud('Andrés Quispe', '987654321', 'andres@ejemplo.pe', true, false,
  :'nilber', :'corte_barba', true, :'san_isidro', null, 'casa', 'Av. Ejemplo 123', 'Piso 4', :'jueves', 'tarde')).id as cita1 \gset
select pruebas.ok((select estado = 'solicitud_recibida' from public.citas where id = :'cita1'), 'la solicitud nace como «solicitud recibida»');
select pruebas.ok((select precio_servicio_pen = 200 and precio_asesoria_pen = 50 and precio_total_pen = 250 from public.citas where id = :'cita1'),
  'corte y barba + asesoría = S/ 250, copiado de la carta');
select pruebas.ok((select hora_confirmada is null from public.citas where id = :'cita1'), 'sin hora hasta que el barbero acepte');
select pruebas.ok((select count(*) = 1 and bool_and(actor = 'cliente' and estado_anterior is null) from public.cita_eventos where cita_id = :'cita1'),
  'historial: 1 evento del cliente');

-- Un cliente que vuelve se reconoce por su WhatsApp.
select (public.crear_solicitud('Andrés Q.', '987654321', null, true, true,
  :'nilber', :'corte', false, :'san_isidro', null, 'oficina', null, null, :'jueves', 'manana')).id as cita2 \gset
select pruebas.ok((select count(*) from public.clientes where whatsapp = '987654321') = 1, 'mismo WhatsApp = mismo cliente');
select pruebas.ok((select correo = 'andres@ejemplo.pe' and consentimiento_marketing from public.clientes where whatsapp = '987654321'),
  'conserva el correo y actualiza el consentimiento de marketing');
select pruebas.ok((select precio_total_pen = 150 from public.citas where id = :'cita2'), 'corte a medida sin asesoría = S/ 150');
select id as barba from public.servicios where slug = 'barba-y-perfilado' \gset
select pruebas.falla(format($$select public.crear_solicitud('Andrés Q.', '987654321', null, true, false,
  %L, %L, false, %L, null, 'casa', null, null, %L, 'manana')$$, :'nilber', :'barba', :'san_isidro', :'jueves'),
  'servicio_no_disponible', 'barba sola ya no se ofrece: no se puede pedir');

-- «Otro distrito» queda pendiente de revisión de zona.
select (public.crear_solicitud('Lucía Ramos', '976543210', null, true, false,
  :'segundo', :'corte', false, null, 'Chorrillos', 'casa', null, null, :'lunes', 'noche')).id as cita3 \gset
select pruebas.ok((select revision_zona and distrito_otro = 'Chorrillos' from public.citas where id = :'cita3'), 'otro distrito: marcado para revisión');
select pruebas.ok((select nota like 'Otro distrito: Chorrillos%' from public.cita_eventos where cita_id = :'cita3'), 'el historial lo anota');

select pruebas.falla(format($$select public.crear_solicitud('Xavier', '955555555', null, true, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'corte', :'san_isidro', :'lunes'), 'sin_horario', 'Nilber no recibe solicitudes un lunes');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '955555555', null, true, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'segundo', :'corte', :'san_isidro', :'domingo'), 'sin_horario', 'nadie atiende domingo');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '955555555', null, true, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'asesoria', :'san_isidro', :'jueves'), 'servicio_debe_ser_principal', 'la asesoría sola no se puede pedir');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '955555555', null, true, false, %L, %L, false, null, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'corte', :'jueves'), 'cita_lugar', 'sin zona ni «otro distrito» no se crea');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '955555555', null, true, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'corte', :'san_isidro', '2020-01-02'), 'fecha_pasada', 'no se pide para una fecha pasada');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '955555555', null, false, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'corte', :'san_isidro', :'jueves'), 'falta_consentimiento', 'sin consentimiento de datos no se crea');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '12345', null, true, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'corte', :'san_isidro', :'jueves'), 'clientes_whatsapp_check', 'WhatsApp de 9 dígitos que empieza con 9');
select pruebas.ok((select count(*) from public.clientes where whatsapp = '955555555') = 0, 'una solicitud rechazada no deja cliente suelto');

-- Cambiar la carta no altera las citas ya creadas.
update public.servicios set precio_pen = 220 where slug = 'corte-y-barba';
select pruebas.ok((select precio_total_pen = 250 from public.citas where id = :'cita1'), 'subir el precio no cambia una cita existente');
update public.servicios set precio_pen = 200 where slug = 'corte-y-barba';
reset role;

\echo '── Barbero: Nilber'
begin;
set local role authenticated;
select pruebas.como('b0000000-0000-4000-8000-00000000000b');
select pruebas.ok(public.barbero_actual() = :'nilber', 'Nilber se reconoce como barbero');
select pruebas.ok((select count(*) from public.citas) = 2, 've solo sus 2 citas');
select pruebas.ok((select count(*) from public.citas where id = :'cita3') = 0, 'no ve la cita del otro barbero');
select pruebas.ok((select count(*) from public.clientes) = 1, 've solo a sus clientes');
select pruebas.ok((select count(*) from public.barberos) = 1, 've solo su ficha de barbero');
select pruebas.ok((select count(*) from public.cita_eventos) = 2, 've solo el historial de sus citas');
select pruebas.ok((select count(*) from public.reclamaciones) = 0, 'no ve reclamaciones');
with r as (update public.citas set motivo = 'x' where id = :'cita3' returning 1)
select pruebas.ok((select count(*) from r) = 0, 'no puede cambiar la cita de otro barbero');

select pruebas.ok((public.cambiar_estado_cita(:'cita1', 'pendiente', 'La reviso hoy')).estado = 'pendiente', 'solicitud → pendiente');
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'confirmada')$$, :'cita1'), 'falta_hora', 'aceptar exige fijar la hora');
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'confirmada', null, '14:00')$$, :'cita1'),
  'hora_fuera_de_franja', 'la hora debe caer dentro de la franja (tarde 15–18)');
select pruebas.ok((public.cambiar_estado_cita(:'cita1', 'confirmada', null, '15:30')).hora_confirmada = '15:30', 'acepta y fija las 15:30');
select pruebas.falla(format($$update public.citas set precio_servicio_pen = 1 where id = %L$$, :'cita1'), 'campos_no_permitidos', 'no cambia precios');
select pruebas.falla(format($$update public.citas set barbero_id = %L where id = %L$$, :'segundo', :'cita1'), 'campos_no_permitidos', 'no se reasigna citas');
select pruebas.falla(format($$update public.citas set direccion = 'otra' where id = %L$$, :'cita1'), 'campos_no_permitidos', 'no cambia la dirección');
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'cancelada')$$, :'cita1'), 'transicion_no_permitida', 'cancelar una confirmada es del cliente o admin');
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'pendiente')$$, :'cita1'), 'transicion_invalida', 'una confirmada no vuelve a pendiente');
select pruebas.ok((public.cambiar_estado_cita(:'cita1', 'completada')).estado = 'completada', 'confirmada → completada');

-- Proponer otro horario
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'reprogramacion', null, null, null, null, null)$$, :'cita2'),
  'falta_propuesta', 'proponer exige día, franja y hora');
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'reprogramacion', null, null, %L, 'manana', '10:00')$$, :'cita2', :'lunes'),
  'sin_horario', 'no propone un día en que no atiende');
select pruebas.ok((public.cambiar_estado_cita(:'cita2', 'reprogramacion', 'Ese jueves estoy lleno', null, :'jueves2', 'noche', '19:00')).estado = 'reprogramacion',
  'propone el jueves siguiente a las 19:00');
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'confirmada')$$, :'cita2'), 'transicion_no_permitida', 'aceptar la propuesta es decisión del cliente');
select pruebas.falla($$insert into public.cita_eventos (cita_id, estado_nuevo, actor) select id, 'completada', 'barber' from public.citas limit 1$$,
  'permission denied', 'nadie escribe el historial a mano');
commit;

\echo '── Usuario sin rol'
begin;
set local role authenticated;
select pruebas.como('d0000000-0000-4000-8000-00000000000d');
select pruebas.ok((select count(*) from public.citas) = 0, 'sin perfil no ve citas');
select pruebas.ok((select count(*) from public.clientes) = 0, 'sin perfil no ve clientes');
select pruebas.falla(format($$select public.crear_solicitud('Xavier', '966666666', null, true, false, %L, %L, false, %L, null, 'casa', null, null, %L, 'tarde')$$,
  :'nilber', :'corte', :'san_isidro', :'jueves'), 'sin_permiso', 'sin perfil no crea solicitudes');
rollback;

\echo '── Administración'
begin;
set local role authenticated;
select pruebas.como('a0000000-0000-4000-8000-00000000000a');
select pruebas.ok((select count(*) from public.citas) = 3, 've todas las citas');
select pruebas.ok((select count(*) from public.barberos where whatsapp is not null) = 2, 've el WhatsApp de los barberos');
-- El cliente aceptó el nuevo horario por WhatsApp: la cita toma la fecha propuesta.
select pruebas.ok((public.cambiar_estado_cita(:'cita2', 'confirmada', 'El cliente aceptó por WhatsApp')).estado = 'confirmada', 'registra que el cliente aceptó');
select pruebas.ok((select fecha = :'jueves2'::date and franja = 'noche' and hora_confirmada = '19:00' and propuesta_fecha is null from public.citas where id = :'cita2'),
  'la cita pasa al horario propuesto');
select pruebas.falla(format($$select public.cambiar_estado_cita(%L, 'pendiente')$$, :'cita1'), 'transicion_invalida', 'una completada no se reabre');
select pruebas.ok((public.cambiar_estado_cita(:'cita3', 'rechazada', 'Chorrillos está fuera de zona')).motivo = 'Chorrillos está fuera de zona', 'rechaza con motivo');
select (public.crear_solicitud('Carlos Díaz', '944444444', null, true, false,
  :'segundo', :'corte', false, :'san_isidro', null, 'hotel', 'Hotel Ejemplo', 'Lobby', :'lunes', 'manana', 'whatsapp')).id as cita4 \gset
select pruebas.ok((select origen = 'whatsapp' from public.citas where id = :'cita4'), 'registra a mano una solicitud de WhatsApp');
select pruebas.ok((select actor = 'admin' and actor_id = 'a0000000-0000-4000-8000-00000000000a' from public.cita_eventos where cita_id = :'cita4'),
  'el historial la atribuye al admin');
update public.servicios set precio_pen = 220 where slug = 'corte-a-medida';
select pruebas.ok((select precio_pen = 220 from public.servicios where slug = 'corte-a-medida'), 'cambia precios de la carta');
select pruebas.ok((select precio_total_pen = 150 from public.citas where id = :'cita4'), 'la cita ya creada mantiene su precio');
rollback;

\echo '── Historial completo de una cita'
select pruebas.ok((
  select array_agg(estado_nuevo::text order by id) = array['solicitud_recibida', 'pendiente', 'confirmada', 'completada']
  from public.cita_eventos where cita_id = :'cita1'), 'cita 1: recibida → pendiente → confirmada → completada');
select pruebas.ok((
  select bool_and(actor = 'barber' and actor_id = 'b0000000-0000-4000-8000-00000000000b')
  from public.cita_eventos where cita_id = :'cita1' and estado_anterior is not null), 'cada cambio con su actor');
select pruebas.ok((select nota = 'La reviso hoy' from public.cita_eventos where cita_id = :'cita1' and estado_nuevo = 'pendiente'), 'con su nota');
select pruebas.ok((select nota = 'Hora: 15:30' from public.cita_eventos where cita_id = :'cita1' and estado_nuevo = 'confirmada'), 'la hora queda anotada');
select pruebas.ok((select nota like 'Ese jueves estoy lleno' from public.cita_eventos where cita_id = :'cita2' and estado_nuevo = 'reprogramacion'), 'la propuesta queda anotada');

\echo '── Libro de Reclamaciones'
set role service_role;
insert into public.reclamaciones (nombre, tipo_documento, numero_documento, domicilio, telefono, correo, tipo_bien, descripcion_bien, tipo, detalle, pedido)
values ('Ana Torres', 'DNI', '12345678', 'Av. Ejemplo 1', '987654321', 'ana@ejemplo.pe', 'servicio', 'Corte', 'reclamo', 'Llegó tarde.', 'Disculpa.'),
       ('Luis Paz', 'DNI', '87654321', 'Av. Ejemplo 2', '912345678', 'luis@ejemplo.pe', 'servicio', 'Barba', 'queja', 'Mala atención.', 'Mejora.');
select pruebas.ok((
  select array_agg(correlativo order by numero) = array['0001-' || extract(year from public.hoy_lima()), '0002-' || extract(year from public.hoy_lima())]
  from public.reclamaciones), 'numeración correlativa por año: 0001, 0002');
select pruebas.falla($$insert into public.reclamaciones (nombre, tipo_documento, numero_documento, domicilio, telefono, correo, menor_de_edad, tipo_bien, descripcion_bien, tipo, detalle, pedido)
  values ('Menor', 'DNI', '11111111', 'X', '987654321', 'm@ejemplo.pe', true, 'servicio', 'Corte', 'reclamo', 'Detalle.', 'Pedido.')$$,
  'reclamaciones_check', 'un menor de edad requiere apoderado');
reset role;
begin;
set local role authenticated;
select pruebas.como('a0000000-0000-4000-8000-00000000000a');
select pruebas.ok((select count(*) from public.reclamaciones) = 2, 'admin lee las reclamaciones');
update public.reclamaciones set respuesta = 'Lamentamos lo ocurrido…', respondido_en = now() where numero = 1;
select pruebas.ok((select respuesta is not null from public.reclamaciones where numero = 1), 'admin responde');
select pruebas.falla($$update public.reclamaciones set detalle = 'cambiado' where numero = 1$$, 'permission denied', 'nadie altera lo que escribió el consumidor');
rollback;

\echo ''
\echo 'Todas las pruebas pasaron.'
