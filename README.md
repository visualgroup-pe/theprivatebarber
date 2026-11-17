# The Private Barber · web

Barbería privada a domicilio en Lima. Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase + Resend.

- `BRIEF.md`: brief técnico (fuente de requisitos).
- `referencia/`: diseño aprobado (`diseno/*.dc.html`), fotos, logotipos y `LEEME.md` con el mapa de imágenes.

## Desarrollo

```bash
npm install
```

```bash
npm run dev
```

- `/`: portada.
- `/resenas`, `/privacidad`, `/terminos`, `/libro-de-reclamaciones`.
- `/reserva`, `/reserva/confirmacion`: solicitud de cita en móvil y confirmación.
- `/convocatoria`: convocatoria de barberos.
- `/ingresar`, `/barbero`, `/admin`: paneles (requieren cuenta con rol; las crea la administración).
- `/ui`: muestrario de componentes, solo en desarrollo.

Copia `.env.example` a `.env.local` y completa los datos pendientes.

## Sistema de diseño

- Tokens de color, curvas y corte de 961 px en `@theme` de `app/globals.css` (Tailwind v4 no usa `tailwind.config`):
  `bg-obsidiana`, `text-huaca-profundo`, `border-piedra`, `ease-marca`, etc. Copia en TS: `lib/tokens.ts`.
- Fuentes con `next/font/google` en `lib/fuentes.ts`: `font-serif` (Instrument Serif), `font-sans` (Hanken Grotesk 400/500/600), `font-mono` (IBM Plex Mono 400/500).
- Componentes: `components/ui/` (Boton, Enlace, EnlaceNav, Chip, Campo, CampoSeleccion, Acordeon, Revelar, ObservadorRevelar) y `components/marca/` (Logo, Monograma, Grano).
- Movimiento: `animation-timeline: view()` con respaldo IntersectionObserver; `prefers-reduced-motion` apaga todo.

## Etapas

1. ✅ Proyecto base, tokens, fuentes y componentes `ui/`.
2. ✅ Portada completa estática.
3. ✅ Reseñas y páginas legales (textos legales en borrador: revisión de un abogado pendiente).
4. ✅ Supabase: esquema, RLS y semillas (ver `supabase/LEEME.md`; `npm run db:probar`).
5. ✅ Formulario de solicitud (escritorio en la portada; móvil en `/reserva`, 3 pasos), `/api/solicitudes` y confirmación.
6. ✅ Paneles del barbero (`/barbero`) y de administración (`/admin`) con Supabase Auth; ingreso en `/ingresar`.
7. ✅ Avisos por correo (Resend) y WhatsApp Cloud API, recordatorio de 24 h y alerta por falta de respuesta (ver «Avisos»).
8. ✅ SEO (canónicas, Open Graph, HairSalon, sitemap, robots), Lighthouse y pruebas E2E (`npm run test:e2e`).

## Convocatoria de barberos

- `/convocatoria` (enlazada en el pie): requisitos, proceso y formulario. Requisitos y umbrales en `content/convocatoria.ts`; la evaluación automática en `lib/convocatoria.ts`.
- Las fotos se reducen en el navegador (1600 px, JPEG, sin metadatos) y suben directo a un bucket **privado** de Supabase Storage con URL firmada (`/api/convocatoria/fotos`). Las que no llegan a enviarse se borran a las 24 h (tarea de cada hora).
- `/admin/postulaciones`: primero las que cumplen requisitos; detalle con fotos, estado (nueva → en revisión → entrevista → prueba de oficio → aprobada / descartada), notas, «Crear ficha de barbero» (queda sin recibir solicitudes) y borrado con fotos.
- Aviso por correo a la administración y acuse al postulante si deja correo.

## Avisos

| Momento | Cliente | Barbero | Administración |
| --- | --- | --- | --- |
| Solicitud nueva (web o registrada a mano) | WhatsApp + correo «solicitud recibida» | WhatsApp con enlace a su panel | — |
| El barbero acepta | WhatsApp + correo «cita confirmada» con la hora | — | — |
| Otro horario propuesto | WhatsApp + correo «nuevo horario» | — | — |
| Rechazada / cancelada | WhatsApp + correo | — | — |
| 24 h antes | WhatsApp + correo «recordatorio» | — | — |
| Sin respuesta del barbero en N horas | — | — | WhatsApp + correo |
| Hoja de reclamación | Copia por correo; respuesta por correo | — | Correo |

- Salen en segundo plano (`after()`), sin demorar la respuesta. Un canal sin claves se omite.
- Cada aviso queda en la tabla `avisos` con su estado; el webhook `/api/whatsapp/webhook` actualiza «entregado» y «leído».
- `/api/cron/avisos` exige `CRON_SECRET`. Mientras Vercel esté en Hobby (tareas solo diarias), la llama **cada hora Supabase** con `pg_cron` + `pg_net` (migración `…600_cron_avisos.sql`); la URL y el secreto están en Supabase Vault (`avisos_url`, `avisos_secreto`, igual a `CRON_SECRET` en Vercel). Al pasar a Pro se puede mover a Vercel Cron.
- Plantillas de WhatsApp para aprobar en Meta: `docs/plantillas-whatsapp.md`.

## Publicación (Vercel)

- Proyecto `theprivatebarber` en el equipo VISUAL Group. Dominio: https://www.theprivatebarber.pro (`theprivatebarber.pro` redirige a www); también https://theprivatebarber.vercel.app. Región `gru1` (São Paulo), junto a Supabase.
- DNS en Hostinger: `A @ → 216.198.79.1` y `A @ → 64.29.17.1`; `CNAME www → 00606ed040877b15.vercel-dns-017.com`.
- Variables cargadas en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (clave propia «vercel_produccion»), `CRON_SECRET`, `SITIO_URL`, `NEXT_PUBLIC_SITIO_URL`, `NEXT_PUBLIC_WHATSAPP_NUMERO` (924 171 401).
- `.vercelignore` impide subir `.env*` y el material de referencia.
- Aún sin vínculo a GitHub (Vercel pide conectar GitHub como método de ingreso de la cuenta). Mientras tanto se publica con `npx vercel deploy --prod`.

## Pruebas

```bash
npm run db:probar
```

```bash
npm run test:e2e
```

- `db:probar`: reglas y permisos de la base (Postgres local, sin Supabase).
- `test:e2e`: 43 pruebas de los flujos del brief con Playwright sobre el build de producción (puerto 3100), con Resend y WhatsApp imitados (`pruebas/e2e/mock-proveedores.cjs`).
  Usan el Supabase de `.env.local`: crean un barbero y cuentas de prueba, y todo lo que escriben lleva el prefijo «Prueba E2E» y se borra al final.
  La prueba de la tarea de cada hora se salta sola si hay citas reales abiertas. Lo ideal es correrlas contra un proyecto de Supabase de prueba.
