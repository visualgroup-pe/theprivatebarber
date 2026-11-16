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
6. Paneles del barbero y de administración.
7. Avisos por correo y WhatsApp.
8. SEO, datos estructurados, Lighthouse y pruebas.
