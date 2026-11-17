/**
 * Política de reprogramación y cancelación. Se usa en los Términos, en las
 * Preguntas y en los avisos de cita confirmada: se cambia solo aquí.
 * Propuesta inicial: revisar con el negocio (y con un abogado) antes de publicar.
 */
export const HORAS_CAMBIO_SIN_COSTO = 2;
export const MINUTOS_TOLERANCIA_BARBERO = 20;
export const CANCELACIONES_TARDIAS_PARA_ADELANTO = 2;
export const PORCENTAJE_ADELANTO = 50;

/** Resumen de una línea (preguntas frecuentes, avisos). */
export const RESUMEN_CANCELACION = `Sí. Puedes reprogramar o cancelar sin costo hasta ${HORAS_CAMBIO_SIN_COSTO} horas antes de la hora confirmada, escribiéndonos por WhatsApp. Antes de que confirmemos tu cita, puedes cancelarla cuando quieras.`;

/** Política completa, punto por punto (Términos y condiciones). */
export const POLITICA_CANCELACION: Array<{ titulo: string; texto: string }> = [
  {
    titulo: "Antes de la confirmación",
    texto: "Mientras tu solicitud no esté confirmada, puedes cancelarla cuando quieras, sin costo.",
  },
  {
    titulo: "Cita confirmada",
    texto: `Puedes reprogramarla o cancelarla sin costo hasta ${HORAS_CAMBIO_SIN_COSTO} horas antes de la hora acordada, escribiéndonos por WhatsApp. Si reprogramas, te proponemos otro horario según la disponibilidad del barbero.`,
  },
  {
    titulo: "Cancelación tardía o ausencia",
    texto: `Si cancelas con menos de ${HORAS_CAMBIO_SIN_COSTO} horas, o el barbero llega y no puede atenderte (no estás o no hay acceso al lugar), la cita cuenta como cancelación tardía. No te cobramos por ello. Si ocurre ${CANCELACIONES_TARDIAS_PARA_ADELANTO} veces, para tus siguientes citas te pediremos un adelanto del ${PORCENTAJE_ADELANTO} % por Yape, Plin o transferencia, que se descuenta del total.`,
  },
  {
    titulo: "Adelantos",
    texto: `Si dejaste un adelanto y cancelas con ${HORAS_CAMBIO_SIN_COSTO} horas o más de anticipación, te lo devolvemos completo. Con menos tiempo, lo aplicamos a una nueva cita dentro de los 30 días siguientes.`,
  },
  {
    titulo: "Si el barbero se retrasa",
    texto: `Si el barbero llega más de ${MINUTOS_TOLERANCIA_BARBERO} minutos después de la hora confirmada sin haberte avisado, puedes cancelar sin costo o reprogramar con prioridad.`,
  },
  {
    titulo: "Si nosotros cancelamos",
    texto: "Si por un imprevisto tenemos que cancelar o mover tu cita, te avisamos lo antes posible por WhatsApp y te ofrecemos otro horario con prioridad. Si dejaste un adelanto, te lo devolvemos completo.",
  },
];
