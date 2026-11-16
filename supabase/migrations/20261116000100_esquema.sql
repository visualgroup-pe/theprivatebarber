-- The Private Barber · v1 · esquema
-- Ocho tablas del brief (servicios, barberos, horarios, zonas, clientes, citas,
-- cita_eventos, reclamaciones) más perfiles (roles del panel) y correlativos
-- (numeración del Libro de Reclamaciones).
-- Zona horaria del negocio: America/Lima. Moneda: soles enteros (IGV incluido).


-- ── Tipos ──────────────────────────────────────────────────────────

-- Estados de una cita (brief · «estados de una cita · 7 estados, 1 decisión del barbero»)
create type public.estado_cita as enum (
  'solicitud_recibida', -- recién enviada (web o WhatsApp)
  'pendiente',          -- el barbero la revisa
  'confirmada',         -- el barbero aceptó y fijó la hora: recién aquí se avisa al cliente
  'rechazada',          -- el barbero no puede atenderla
  'reprogramacion',     -- el barbero propuso otro horario; espera respuesta del cliente
  'cancelada',          -- el cliente no aceptó el nuevo horario, o se canceló una confirmada
  'completada'          -- servicio realizado
);

-- Franjas: mañana 9–12, mediodía 12–15, tarde 15–18, noche 18–21
create type public.franja as enum ('manana', 'mediodia', 'tarde', 'noche');

create type public.lugar_atencion as enum ('casa', 'oficina', 'hotel');
create type public.origen_cita as enum ('web', 'whatsapp');
create type public.rol_panel as enum ('admin', 'barber');
create type public.tipo_reclamacion as enum ('reclamo', 'queja');
create type public.tipo_bien as enum ('servicio', 'producto');

-- ── Perfiles del panel (barberos y administración) ─────────────────

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol_panel not null,
  nombre text not null,
  creado_en timestamptz not null default now()
);
comment on table public.perfiles is 'Rol de cada usuario del panel. Sin fila = sin acceso.';

-- ── Catálogo ───────────────────────────────────────────────────────

create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre text not null,
  descripcion text not null default '',
  descripcion_corta text not null default '',
  duracion_texto text not null default '',
  precio_pen integer not null check (precio_pen >= 0),
  duracion_min integer check (duracion_min > 0),
  duracion_max integer check (duracion_max >= duracion_min),
  es_adicional boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 0
);
comment on column public.servicios.precio_pen is 'Soles, sin decimales, IGV incluido.';
comment on column public.servicios.es_adicional is 'Adicional (asesoría): solo se pide junto a un servicio principal.';

create table public.barberos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre text not null,
  foto_url text,
  anos_oficio integer check (anos_oficio >= 0),
  especialidad text,
  whatsapp text check (whatsapp ~ '^9\d{8}$'),
  user_id uuid unique references auth.users (id) on delete set null,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);
comment on column public.barberos.whatsapp is 'Privado: solo admin y el propio barbero. 9 dígitos, sin +51.';

create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  barbero_id uuid not null references public.barberos (id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 1 and 7),
  hora_inicio time not null,
  hora_fin time not null,
  check (hora_fin > hora_inicio),
  unique (barbero_id, dia_semana, hora_inicio)
);
comment on column public.horarios.dia_semana is 'ISO 8601: 1 = lunes … 7 = domingo.';

create table public.zonas (
  id uuid primary key default gen_random_uuid(),
  distrito text not null unique,
  activo boolean not null default true,
  orden integer not null default 0
);

-- ── Clientes y citas ───────────────────────────────────────────────

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) between 2 and 120),
  whatsapp text not null unique check (whatsapp ~ '^9\d{8}$'),
  correo text check (correo is null or correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consentimiento_datos boolean not null check (consentimiento_datos),
  consentimiento_marketing boolean not null default false,
  consentimiento_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
comment on column public.clientes.consentimiento_datos is 'Ley 29733: obligatorio para gestionar la cita.';
comment on column public.clientes.consentimiento_marketing is 'Ley 29733: casilla separada y opcional.';

create table public.citas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  barbero_id uuid not null references public.barberos (id) on delete restrict,
  servicio_id uuid not null references public.servicios (id) on delete restrict,
  con_asesoria boolean not null default false,
  -- Lugar: una de las zonas o «otro distrito» (queda para revisión de zona)
  zona_id uuid references public.zonas (id) on delete restrict,
  distrito_otro text,
  revision_zona boolean generated always as (zona_id is null) stored,
  lugar public.lugar_atencion,
  direccion text,
  referencia text,
  -- Cuándo
  fecha date not null,
  franja public.franja not null,
  hora_confirmada time,
  -- Precios copiados al crear: un cambio de carta no altera citas pasadas
  precio_servicio_pen integer not null default 0 check (precio_servicio_pen >= 0),
  precio_asesoria_pen integer not null default 0 check (precio_asesoria_pen >= 0),
  precio_total_pen integer generated always as (precio_servicio_pen + precio_asesoria_pen) stored,
  -- Estado
  estado public.estado_cita not null default 'solicitud_recibida',
  motivo text,
  propuesta_fecha date,
  propuesta_franja public.franja,
  propuesta_hora time,
  origen public.origen_cita not null default 'web',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint cita_lugar check (zona_id is not null or length(trim(coalesce(distrito_otro, ''))) > 0),
  constraint cita_confirmada_con_hora check (estado not in ('confirmada', 'completada') or hora_confirmada is not null),
  constraint cita_reprogramacion_con_propuesta check (
    estado <> 'reprogramacion' or (propuesta_fecha is not null and propuesta_franja is not null and propuesta_hora is not null)
  )
);
comment on column public.citas.revision_zona is 'true cuando el cliente eligió «otro distrito».';
comment on column public.citas.hora_confirmada is 'La fija el barbero al aceptar, dentro de la franja.';

create index citas_barbero_fecha on public.citas (barbero_id, fecha);
create index citas_estado on public.citas (estado);
create index citas_cliente on public.citas (cliente_id);

create table public.cita_eventos (
  id bigint generated always as identity primary key,
  cita_id uuid not null references public.citas (id) on delete cascade,
  estado_anterior public.estado_cita,
  estado_nuevo public.estado_cita not null,
  actor_id uuid references auth.users (id) on delete set null,
  actor text not null check (actor in ('cliente', 'barber', 'admin', 'sistema')),
  nota text,
  creado_en timestamptz not null default now()
);
comment on table public.cita_eventos is 'Historial: cada cambio de estado con fecha, actor y nota. Solo lo escriben los triggers.';
create index cita_eventos_cita on public.cita_eventos (cita_id, creado_en);

-- ── Libro de Reclamaciones ─────────────────────────────────────────

create table public.correlativos (
  anio integer primary key,
  ultimo integer not null default 0
);
comment on table public.correlativos is 'Último número de hoja de reclamación por año.';

create table public.reclamaciones (
  id uuid primary key default gen_random_uuid(),
  anio integer not null,
  numero integer not null,
  correlativo text generated always as (lpad(numero::text, 4, '0') || '-' || anio::text) stored unique,
  -- 1. Consumidor reclamante
  nombre text not null,
  tipo_documento text not null check (tipo_documento in ('DNI', 'CE', 'Pasaporte')),
  numero_documento text not null,
  domicilio text not null,
  telefono text not null,
  correo text not null,
  menor_de_edad boolean not null default false,
  apoderado text,
  -- 2. Bien contratado
  tipo_bien public.tipo_bien not null,
  monto_reclamado numeric(10, 2) check (monto_reclamado >= 0),
  descripcion_bien text not null,
  -- 3. Detalle y pedido
  tipo public.tipo_reclamacion not null,
  detalle text not null,
  pedido text not null,
  -- 4. Respuesta del proveedor
  respuesta text,
  respondido_en timestamptz,
  -- Fechas
  creado_en timestamptz not null default now(),
  copia_enviada_en timestamptz,
  unique (anio, numero),
  check (not menor_de_edad or apoderado is not null)
);
