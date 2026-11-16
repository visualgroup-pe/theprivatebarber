# Supabase · The Private Barber

Esquema, reglas y permisos de la v1. Todo vive en `migrations/`; las semillas en `seed.sql`.

| Archivo | Qué contiene |
| --- | --- |
| `migrations/…100_esquema.sql` | Tipos y tablas: servicios, barberos, horarios, zonas, clientes, citas, cita_eventos, reclamaciones, perfiles y correlativos |
| `migrations/…200_reglas.sql` | Reglas del negocio en triggers y funciones (ver abajo) |
| `migrations/…300_seguridad.sql` | RLS y permisos por rol |
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

## Conectar el proyecto real

1. Crear el proyecto en Supabase (región São Paulo, la más cercana a Lima) y copiar la URL y las claves en `.env.local` (ver `.env.example`).
2. Enlazar y aplicar las migraciones:

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref <ref-del-proyecto>
   ```

   ```bash
   npx supabase db push --include-seed
   ```

3. Regenerar los tipos de TypeScript: `npm run db:tipos`.
4. Crear las cuentas del panel en Authentication → Users (el registro público está desactivado) y darles rol en el SQL editor:

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
