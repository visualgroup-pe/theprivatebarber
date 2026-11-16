# The Private Barber — Brief técnico de la web

Nov 15, 2026 · @Mathías & Raquel

## Objetivo y alcance

La v1 de la web es el sitio público de The Private Barber, con solicitud de cita que el barbero acepta o rechaza; se construye en Claude Code a partir del lienzo de diseño aprobado ([Sitio web, lienzo](https://claude.ai/artifact/7kV3d9zwrJcaHSnDgbeysM)).

**Entra en la v1**

- Portada con 12 bloques, página de reseñas y páginas legales (privacidad, términos, Libro de Reclamaciones).
- Formulario de solicitud de cita: servicio, adicional de asesoría, distrito, fecha, franja horaria, nombre y WhatsApp.
- Panel del barbero: ver solicitudes, aceptar, rechazar o proponer otro horario.
- Panel de administración: servicios, precios, barberos, horarios, zonas y solicitudes.
- Avisos por WhatsApp y correo en cada cambio de estado.

**Queda para la Fase 6**

- Pago en línea, comprobantes electrónicos SUNAT, métricas y pagos a barberos.
- Cuenta de cliente con historial y ficha personal.

## Stack, servicios y costos

Next.js en Vercel con Supabase como base de datos y autenticación; costo estimado de US$ 51 a 113 al mes según volumen, como se definió en la [arquitectura de la plataforma](https://claude.ai/artifact/DZREUuvAdiJ9sjh1PqFX7T).

| Capa | Elección | Uso en la v1 |
| --- | --- | --- |
| Framework | Next.js (App Router), TypeScript | Sitio, paneles y API |
| Estilos | Tailwind CSS con los tokens de marca | Todo el diseño |
| Hosting | Vercel Pro | Despliegue, imágenes, dominio |
| Base de datos y acceso | Supabase Pro (Postgres, Auth, Storage) | Citas, barberos, panel |
| Formularios | React Hook Form + Zod | Validación en cliente y servidor |
| Avisos | WhatsApp Cloud API (Meta) + Resend | Confirmaciones y cambios de estado |
| Pagos | Mercado Pago (Izipay si Plin es prioridad) | Fase 6 |
| Comprobantes | Proveedor OSE/PSE para SUNAT | Fase 6 |
| Analítica | Vercel Analytics + Meta Pixel con consentimiento | Medición de reservas |

Zona horaria del sistema: America/Lima. Moneda: soles (PEN), sin decimales en la web.

## Estructura del proyecto Next.js

Un solo repositorio con tres zonas: el sitio público, el panel del barbero y el panel de administración.

```
app/
  (sitio)/
    page.tsx                → portada
    resenas/page.tsx
    privacidad/page.tsx
    terminos/page.tsx
    libro-de-reclamaciones/page.tsx
    reserva/confirmacion/page.tsx
  barbero/                  → protegido, rol barber
    page.tsx                → solicitudes del día
    cita/[id]/page.tsx
  admin/                    → protegido, rol admin
    page.tsx
    servicios/ barberos/ zonas/ citas/
  api/
    solicitudes/route.ts    → crea la solicitud
    whatsapp/webhook/route.ts
components/
  marca/   Logo, Monograma, Grano
  ui/      Boton, Enlace, Chip, Campo, Acordeon, Revelar
  bloques/ Hero, Manifiesto, LaVisita, Carta, Asesoria,
           ComoReservar, Barberos, Zonas, Resenas, Preguntas,
           Reserva, Pie, NavFija
lib/
  supabase/ (client.ts, server.ts), whatsapp.ts, correo.ts,
  disponibilidad.ts, tokens.ts
content/
  servicios.ts, zonas.ts, resenas.ts, preguntas.ts
public/
  img/, marca/, favicon/
```

El contenido fijo (textos, preguntas, reseñas) vive en `content/` en la v1. Servicios, precios, barberos y zonas se leen de Supabase para que el panel de administración los cambie sin desplegar.

## Sistema de diseño

El diseño sigue el lienzo al pie de la letra: copiar medidas, colores y tiempos de allí antes que interpretarlos.

**Colores** (en `tailwind.config` como `obsidiana`, `tabaco`, etc.)

| Token | Hex | Uso |
| --- | --- | --- |
| obsidiana | #161B18 | Fondos oscuros, texto principal, botón principal |
| tabaco | #5A4636 | Texto secundario sobre claro, fondo de Barberos |
| huaca | #A0634A | Acento, relleno del botón al pasar el cursor |
| huaca-profundo | #8E5640 | Texto pequeño de acento sobre claro |
| huaca-claro | #C98A6E | Acento sobre oscuro |
| lino | #EEE9E1 | Fondo base |
| piedra | #D8D1C5 | Fondo de secciones alternas |
| garua | #C9CCC7 | Texto secundario sobre oscuro |

Sin negro puro ni dorado. Texto pequeño con contraste mínimo 4.5:1.

**Tipografía** con `next/font/google`: Instrument Serif (titulares, nunca en negrita), Hanken Grotesk 400/500/600 (texto), IBM Plex Mono 400/500 (solo precios, horas y números). Titular de portada: `clamp(78px, 14vw, 236px)`, interlineado 0.84, tracking −0.04em.

**Componentes base**

- `Boton`: relleno Huaca que sube desde abajo en 0.7 s; flecha que avanza 7 px. Variantes oscura, clara y pequeña (44 px de alto).
- `Enlace`: subrayado que se recoge hacia la derecha al pasar el cursor.
- `Chip`: radio o casilla real con apariencia de opción táctil; marcado = fondo Lino.
- `Campo`: solo línea inferior; al enfocarse cambia a Huaca claro.
- `Acordeon`: `details`/`summary` nativo con el signo + que gira 45°.
- `Grano`: capa fija con `grano.png` al 9 % en modo overlay.

**Movimiento**

- Curva base `cubic-bezier(.16,1,.3,1)`; cortina `cubic-bezier(.65,0,.35,1)`.
- Entrada del hero: texto escalonado cada 0.15 s; foto con cortina de 1.6 s y acercamiento de 2.8 s.
- Al hacer scroll: aparición y cortina con `animation-timeline: view()` y respaldo con IntersectionObserver para Safari y Firefox.
- Con `prefers-reduced-motion` se apaga todo movimiento.

## Páginas y rutas

Siete rutas públicas y dos paneles protegidos; la portada lleva el orden de bloques del lienzo.

| Ruta | Contenido | Acceso |
| --- | --- | --- |
| `/` | Nav fija, hero, manifiesto, la visita, la carta, asesoría, cómo reservar, barberos, zonas, reseñas, preguntas, reserva, pie | Público |
| `/resenas` | Reseñas completas de Google y llamado a reservar | Público |
| `/reserva/confirmacion` | “Recibimos tu solicitud”, resumen y próximos pasos | Público |
| `/privacidad` | Política de privacidad (Ley 29733) | Público |
| `/terminos` | Términos y política de cancelación | Público |
| `/libro-de-reclamaciones` | Formulario oficial con número correlativo | Público |
| `/barbero` | Solicitudes y agenda del barbero | Rol barber |
| `/admin` | Servicios, precios, barberos, zonas, citas | Rol admin |

**Carta de servicios** (semilla de la tabla `servicios`)

| Servicio | Precio | Duración | Tipo |
| --- | --- | --- | --- |
| Corte a medida | S/ 200 | 45 min – 1 h | Principal |
| Barba y perfilado | S/ 100 | 45 min – 1 h | Principal |
| Corte y barba | S/ 300 | 45 min – 1 h | Principal |
| Asesoría de imagen | S/ 50 | Sin duración propia | Adicional: solo junto a un servicio principal |

**Barberos y horarios**: Nilber atiende los jueves; \[segundo barbero, nombre pendiente\] de lunes a sábado de 9:00 a 21:00. **Zonas**: San Isidro, Miraflores, Santiago de Surco, San Borja y La Molina.

## Flujo de reserva y estados

Una solicitud no es una cita: queda pendiente hasta que el barbero la acepta, y solo entonces el cliente recibe la confirmación.

&#91;embedded content: estados de una cita · 7 estados, 1 decisión del barbero\]

**Reglas**

- El formulario solo ofrece días y franjas con horario del barbero: jueves para Nilber, lunes a sábado de 9:00 a 21:00 para el segundo barbero.
- “Otro distrito” crea la solicitud marcada para revisión de zona.
- La asesoría es una casilla; sin un servicio principal elegido, no se puede marcar.
- Al aceptar, el barbero fija la hora exacta dentro de la franja.
- Si el barbero no responde en \[X horas\], el admin recibe una alerta.
- Toda solicitud se puede hacer también por WhatsApp; el admin la registra a mano en el panel.

## Modelo de datos en Supabase

Ocho tablas cubren la v1; los precios se copian a la cita al crearla para que un cambio de carta no altere citas pasadas.

| Tabla | Campos principales |
| --- | --- |
| `servicios` | id, nombre, slug, precio\_pen, duracion\_min, duracion\_max, es\_adicional, activo, orden |
| `barberos` | id, nombre, foto\_url, anos\_oficio, especialidad, whatsapp, user\_id, activo |
| `horarios` | id, barbero\_id, dia\_semana (1–7), hora\_inicio, hora\_fin |
| `zonas` | id, distrito, activo |
| `clientes` | id, nombre, whatsapp, correo, consentimiento\_datos, consentimiento\_marketing, creado\_en |
| `citas` | id, cliente\_id, barbero\_id, servicio\_id, con\_asesoria, zona\_id, direccion, referencia, fecha, franja, hora\_confirmada, precio\_total\_pen, estado, motivo, creado\_en, actualizado\_en |
| `cita_eventos` | id, cita\_id, estado\_anterior, estado\_nuevo, actor, nota, creado\_en |
| `reclamaciones` | id, correlativo, datos del consumidor, bien contratado, detalle, pedido, respuesta, fechas |

**Seguridad (RLS)**

- El público solo inserta en `citas` y `clientes` a través de la ruta de API, nunca directo.
- Un barbero solo lee y cambia las citas asignadas a él.
- El rol admin lo ve todo. Cada cambio de estado escribe una fila en `cita_eventos`.

**Franjas**: mañana 9–12, mediodía 12–15, tarde 15–18, noche 18–21. El barbero fija la hora exacta al aceptar.

## Integraciones

En la v1 solo los avisos son obligatorios; pagos y comprobantes quedan preparados en el modelo de datos pero se activan en la Fase 6.

| Integración | Qué hace | Cuándo | Requisito |
| --- | --- | --- | --- |
| WhatsApp Cloud API | Plantillas aprobadas: solicitud recibida, cita confirmada, nuevo horario propuesto, cita rechazada, recordatorio 24 h antes | v1 | Número de WhatsApp Business y cuenta de Meta verificada |
| WhatsApp al barbero | Aviso de nueva solicitud con enlace al panel | v1 | Número de cada barbero |
| Resend | Los mismos avisos por correo, con el diseño de marca | v1 | Dominio verificado (SPF, DKIM) |
| Mercado Pago / Izipay | Cobro con tarjeta, Yape y Plin | Fase 6 | Cuenta comercial |
| Proveedor SUNAT | Boleta o factura electrónica | Fase 6 | RUC y proveedor OSE/PSE |

El enlace “Escríbenos por WhatsApp” de la web usa `https://wa.me/51<número>?text=` con un mensaje prellenado. Las plantillas de WhatsApp deben enviarse a aprobación de Meta antes del lanzamiento.

## Accesibilidad, rendimiento, SEO y legal

La web se diseña primero para el celular y debe pasar Lighthouse con 90 o más en las cuatro categorías.

**Accesibilidad**

- Botones y enlaces reales, objetivos táctiles de 44 px o más, foco visible en Huaca.
- Formulario con `label`, `fieldset` y `legend`; errores en texto, no solo en color.
- Imágenes con `alt` descriptivo; las decorativas con `alt=""`.

**Rendimiento**

- `next/image` en AVIF/WebP, `priority` solo en la foto del hero, `sizes` correctos.
- Fuentes con `display: swap` y solo los pesos usados.
- LCP < 2.5 s y CLS < 0.1 en 4G.

**SEO local**

- Metadatos por página, Open Graph con la foto del hero y el logo.
- Datos estructurados `LocalBusiness` con tipo `HairSalon`, `areaServed` con los cinco distritos y horario.
- `sitemap.xml`, `robots.txt` y URL canónica.

**Legal en Perú**

- Libro de Reclamaciones virtual con enlace visible en el pie (Código de Protección y Defensa del Consumidor).
- Política de privacidad y casillas de consentimiento separadas para datos y marketing (Ley 29733); registro del banco de datos ante la ANPD.
- Precios en soles con IGV incluido, mostrados antes de enviar la solicitud.
- Banner de cookies si se usa Meta Pixel.

## Contenido y assets pendientes

Estos datos faltan antes de publicar; la web puede construirse con los marcadores entre corchetes del lienzo.

- [ ] Nombre, foto y especialidad del segundo barbero; especialidad de Nilber
- [ ] Foto real de Nilber (la actual parece generada o retocada con IA)
- [ ] Sesión de fotos propia para reemplazar las imágenes de Pexels
- [ ] Confirmar de qué perfil de Google son las tres reseñas y su enlace; calificación y total de reseñas
- [ ] Anticipación mínima para reservar y política de reprogramación y cancelación
- [ ] Dominio, número de WhatsApp Business, Instagram y correo
- [ ] Razón social y RUC

**Assets listos**: logotipos y favicons en `TPB_Identidad_Visual_v2.zip`, colores en `tpb-colores.css`, textura `grano.png` y fotos tratadas del lienzo.

## Prompt de arranque para Claude Code

Pega este texto en Claude Code con el repositorio vacío, junto con este brief exportado en Markdown, el HTML del lienzo y la carpeta de identidad visual.

```markdown
Vas a construir la web de The Private Barber, barbería privada a domicilio en Lima.
Lee primero BRIEF.md (este documento) y la carpeta /referencia, que contiene
Main.dc.html y Resenas.dc.html: son el diseño aprobado. Réplicalo con fidelidad:
mismos textos, colores, tipografías, espaciados y animaciones.

Stack: Next.js (App Router) + TypeScript + Tailwind + Supabase + Resend.
Idioma: español de Perú. Zona horaria America/Lima. Moneda PEN.

Trabaja por etapas y muéstrame cada una antes de seguir:
1. Proyecto base, tokens de marca en Tailwind, fuentes y componentes ui/.
2. Portada completa estática, mobile first, con animaciones y reduced motion.
3. Página de reseñas y páginas legales.
4. Supabase: esquema, RLS y semillas (servicios, barberos, horarios, zonas).
5. Formulario de solicitud con validación Zod y página de confirmación.
6. Panel del barbero y panel de administración con Supabase Auth.
7. Avisos por correo (Resend) y WhatsApp Cloud API detrás de variables de entorno.
8. SEO, datos estructurados, Lighthouse ≥ 90 y pruebas de los flujos.

Reglas: no inventes precios, reseñas, datos de barberos ni certificaciones.
Deja los marcadores [entre corchetes] del diseño como están.
```

Descomprime TPB\_Web\_Referencia.zip (diseño en HTML, fotos, logotipos y textura, con un mapa de imágenes) en `/referencia` del repositorio.

## Criterios de aceptación

La v1 se da por terminada cuando todo lo siguiente se cumple en un celular de gama media y en escritorio.

- [ ] La portada y reseñas coinciden con el lienzo a 390 px y 1440 px de ancho
- [ ] Una solicitud enviada crea la cita en estado “solicitud recibida” y avisa al barbero en menos de 1 minuto
- [ ] El cliente no recibe confirmación hasta que el barbero acepta
- [ ] La asesoría de imagen solo puede pedirse junto a un servicio principal y suma S/ 50
- [ ] No se puede pedir cita un día sin horario del barbero ni fuera de los cinco distritos (salvo “otro distrito”, que queda pendiente de revisión)
- [ ] El barbero solo ve sus citas; el admin ve todas
- [ ] Cada cambio de estado queda registrado con fecha, actor y nota
- [ ] Con movimiento reducido no hay animaciones
- [ ] Lighthouse ≥ 90 en rendimiento, accesibilidad, buenas prácticas y SEO
- [ ] Libro de Reclamaciones, privacidad y términos publicados y enlazados en el pie
