# Supabase · The Private Barber

Esquema, reglas y permisos de la v1. Todo vive en `migrations/`; las semillas en `seed.sql`.

| Archivo | Qué contiene |
| --- | --- |
| `migrations/…100_esquema.sql` | Tipos y tablas: servicios, barberos, horarios, zonas, clientes, citas, cita_eventos, reclamaciones, perfiles y correlativos |
| `migrations/…200_reglas.sql` | Reglas del negocio en triggers y funciones (ver abajo) |
| `migrations/…300_seguridad.sql` | RLS y permisos por rol |
| `migrations/…400_ajustes_asesor.sql` | Ajustes del asesor de Supabase: funciones de rol en esquema privado, una política por acción, índices |
| `migrations/…500_avisos.sql` | Tabla `avisos` (registro de envíos) y marcas de recordatorio y alerta en `citas` |
| `seed.sql` | Carta, zonas, barberos y horarios del brief (se puede repetir sin duplicar) |
| `pruebas/` | Pruebas locales (`npm run db:probar`) con un Postgres desechable |

## Estados de una cita

```
solicitud_recibida → pendiente → ¿acepta? ─ sí ──→ confirmada → completada
                                   ├─ no ──→ rechazada            ↘ cancelada
                                   └─ otro horario → reprogramacion ─ el cliente acepta → confirmada
                                                                    └ no acepta → cancelada
```

- El barbero decide: pendiente, confirmada (con la hora exacta dentro de la franja), rechazada, reprogramación y completada.
- Aceptar el horario propuesto o cancelar es del cliente: lo registra la administración o el sistema.
- Una solicitud aún sin respuesta también puede cancelarse.
- Cada cambio escribe una fila en `cita_eventos` con estado anterior, nuevo, actor y nota.

## Reglas que aplica la base de datos

- Toda cita nace como `solicitud_recibida`, sin hora: el cliente no recibe confirmación hasta que el barbero acepta.
- El precio se copia de la carta al crear la cita; un cambio de carta no altera citas existentes.
- La asesoría solo va junto a un servicio principal (`con_asesoria`), y suma su precio.
- Solo se aceptan días y franjas en que el barbero tiene horario, y nunca fechas pasadas (hora de Lima).
- Zona activa u «otro distrito» (`distrito_otro`), que deja la cita con `revision_zona = true`.
- Un barbero solo puede cambiar el estado, la hora y la propuesta de sus citas.
- Libro de Reclamaciones: número correlativo por año (`0001-2026`).

## Permisos

| Rol | Qué puede hacer |
| --- | --- |
| Visitante (`anon`) | Leer la carta, zonas, horarios y nombre/foto de barberos activos. Nada más. |
| Servidor (`service_role`) | Crear solicitudes (`crear_solicitud`) y reclamaciones; enviar avisos. |
| Barbero | Ver y gestionar solo sus citas, sus clientes y su historial. |
| Admin | Todo, incluida la carta, barberos, horarios, zonas y respuestas a reclamos. |

El WhatsApp de los barberos no es público.

## Proyecto

- **theprivatebarber** · ref `mqrqdmmexrpheljkpthg` · São Paulo (`sa-east-1`) · Postgres 17 · plan gratuito (pasar a Pro antes del lanzamiento).
- Organización: visualgroup-pe's Org.
- Migraciones aplicadas: las cinco de `migrations/` y `seed.sql`. Asesor de Supabase: sin advertencias (solo avisos informativos esperados).
- Claves de API: la publicable va en la web; para el servidor, crear en el panel una clave secreta para producción (Vercel). La clave secreta `claude_dev` es solo del contenedor de desarrollo: se puede revocar en Project Settings → API Keys.

## Aplicar cambios

Con un token de acceso personal (Account → Access Tokens), sin conexión directa a Postgres:

```bash
SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_REF=mqrqdmmexrpheljkpthg npm run db:migrar
```

```bash
SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_REF=mqrqdmmexrpheljkpthg npm run db:tipos
```

`db:migrar` aplica solo las migraciones nuevas, cada una en una transacción, y las registra en
`supabase_migrations.schema_migrations` (compatible con `supabase db push`). Con `-- --semillas` vuelve a cargar `seed.sql`.

Comprobar el proyecto real como lo usa la web (visitante y servidor; crea y borra una solicitud de prueba):

```bash
node --env-file=.env.local scripts/verificar-remoto.mjs
```

## Cuentas del panel

Crear las cuentas en Authentication → Users (el registro público está desactivado) y darles rol en el SQL editor:

```sql
insert into public.perfiles (id, rol, nombre)
values ('<uuid del usuario>', 'admin', 'Administración');

insert into public.perfiles (id, rol, nombre)
values ('<uuid del usuario de Nilber>', 'barber', 'Nilber');
update public.barberos set user_id = '<uuid del usuario de Nilber>', whatsapp = '9XXXXXXXX'
where slug = 'nilber';
```

## Pruebas locales

```bash
npm run db:probar
```

Levanta un Postgres temporal, aplica un *shim* con lo mínimo de Supabase (roles y `auth.uid()`), las migraciones y las semillas, y comprueba reglas y permisos como visitante, servidor, barbero, usuario sin rol y admin.
