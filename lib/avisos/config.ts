import "server-only";

/**
 * Configuración de avisos desde variables de entorno (ver .env.example).
 * Un canal sin sus claves se omite: la web funciona igual y el aviso queda
 * registrado como «omitido».
 */
const env = process.env;

export const avisos = {
  /** URL pública del sitio, para los enlaces de los mensajes. */
  sitioUrl: (env.SITIO_URL || env.NEXT_PUBLIC_SITIO_URL || "http://localhost:3000").replace(/\/$/, ""),
  correo: {
    clave: env.RESEND_API_KEY ?? "",
    remitente: env.CORREO_REMITENTE ?? "",
    responderA: env.CORREO_RESPONDER_A || undefined,
    url: (env.RESEND_API_URL || "https://api.resend.com").replace(/\/$/, ""),
  },
  whatsapp: {
    token: env.WHATSAPP_TOKEN ?? "",
    numeroId: env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    version: env.WHATSAPP_API_VERSION || "v23.0",
    idioma: env.WHATSAPP_IDIOMA || "es",
    url: (env.WHATSAPP_API_URL || "https://graph.facebook.com").replace(/\/$/, ""),
    secretoApp: env.WHATSAPP_APP_SECRET ?? "",
    tokenVerificacion: env.WHATSAPP_VERIFY_TOKEN ?? "",
  },
  admin: {
    correo: env.ADMIN_CORREO ?? "",
    whatsapp: (env.ADMIN_WHATSAPP ?? "").replace(/\D/g, ""),
  },
  /** Horas sin respuesta del barbero antes de alertar a la administración. Pendiente del brief: [X horas]. */
  horasSinRespuesta: Number(env.AVISO_SIN_RESPUESTA_HORAS || 4),
  /** Secreto que Vercel Cron envía como «Authorization: Bearer …». */
  secretoCron: env.CRON_SECRET ?? "",
};

export const correoActivo = () => Boolean(avisos.correo.clave && avisos.correo.remitente);
export const whatsappActivo = () => Boolean(avisos.whatsapp.token && avisos.whatsapp.numeroId);
