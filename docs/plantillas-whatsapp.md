# Plantillas de WhatsApp para Meta

Generado desde `lib/avisos/plantillas.ts`. Enviar cada una a aprobación en WhatsApp Manager → Plantillas de mensajes antes del lanzamiento:

- **Categoría:** Utilidad (avisos sobre una cita que el cliente pidió).
- **Idioma:** Español (`es`). Si se aprueban en otra variante, cambiar `WHATSAPP_IDIOMA`.
- **Nombre:** exactamente el de abajo. **Cuerpo:** exactamente el texto, con las variables `{{n}}` en ese orden.
- **Ejemplos:** Meta los pide para cada variable; se pueden usar los de la tabla.

Mientras una plantilla no esté aprobada, el envío falla y queda registrado como «fallido» en la tabla `avisos`; el correo se envía igual.

## `tpb_solicitud_recibida`

**Para:** Cliente

> Hola {{1}}, recibimos tu solicitud de cita en The Private Barber: {{2}}, {{3}}, en {{4}}. Tu cita aún no está confirmada: te escribiremos en cuanto {{5}} la acepte.

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Andrés |
| {{2}} | Corte y barba + asesoría |
| {{3}} | jueves 10 de diciembre, tarde (15–18) |
| {{4}} | San Isidro |
| {{5}} | Nilber |

## `tpb_cita_confirmada`

**Para:** Cliente

> Hola {{1}}, tu cita está confirmada: {{2}}, {{3}} a las {{4}}, en {{5}}. Te atiende {{6}}. Total: {{7}}, IGV incluido.

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Andrés |
| {{2}} | Corte y barba + asesoría |
| {{3}} | jueves 10 de diciembre |
| {{4}} | 15:30 |
| {{5}} | San Isidro |
| {{6}} | Nilber |
| {{7}} | S/ 350 |

## `tpb_nuevo_horario`

**Para:** Cliente

> Hola {{1}}, {{2}} no puede atenderte en el horario que pediste y te propone {{3}} a las {{4}}. Responde a este mensaje para aceptarlo o pedir otro.

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Andrés |
| {{2}} | Nilber |
| {{3}} | jueves 17 de diciembre |
| {{4}} | 19:00 |

## `tpb_cita_rechazada`

**Para:** Cliente

> Hola {{1}}, lo sentimos: no podemos atender tu solicitud del {{2}}. {{3}} Si quieres, responde a este mensaje y buscamos otra fecha.

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Andrés |
| {{2}} | jueves 10 de diciembre |
| {{3}} | Ese día no tenemos disponibilidad en tu distrito. |

## `tpb_cita_cancelada`

**Para:** Cliente

> Hola {{1}}, tu cita del {{2}} quedó cancelada. {{3}} Para reservar otra fecha, responde a este mensaje.

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Andrés |
| {{2}} | jueves 10 de diciembre |
| {{3}} | Gracias por avisarnos. |

## `tpb_recordatorio`

**Para:** Cliente

> Hola {{1}}, te recordamos tu cita de mañana: {{2}} a las {{3}}, en {{4}}. Ten listo un espacio con buena luz, una silla y un enchufe cerca.

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Andrés |
| {{2}} | Corte y barba |
| {{3}} | 15:30 |
| {{4}} | San Isidro |

## `tpb_barbero_nueva_solicitud`

**Para:** Barbero

> Nueva solicitud: {{1}}, {{2}}, en {{3}}. Revísala y respóndela en tu panel: {{4}}

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Corte y barba + asesoría |
| {{2}} | jueves 10 de diciembre, tarde (15–18) |
| {{3}} | San Isidro |

## `tpb_admin_sin_respuesta`

**Para:** Administración

> La solicitud de {{1}} para el {{2}} lleva más de {{3}} horas sin respuesta de {{4}}. Revísala: {{5}}

| Variable | Ejemplo |
| --- | --- |
| {{1}} | Andrés |
| {{2}} | jueves 10 de diciembre |
| {{3}} | 4 |
| {{4}} | Nilber |
