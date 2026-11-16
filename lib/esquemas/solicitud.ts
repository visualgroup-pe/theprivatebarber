import { z } from "zod";
import type { Barbero } from "@/content/barberos";
import { describirDias, franjasDisponibles } from "@/lib/disponibilidad";

/**
 * Solicitud de cita: mismo esquema en el navegador (React Hook Form) y en
 * /api/solicitudes. La base de datos vuelve a validar horario, precios y zona.
 */
export const OTRO_DISTRITO_ID = "otro";
const FRANJAS = ["manana", "mediodia", "tarde", "noche"] as const;

/** «+51 987 654 321», «987-654-321» → «987654321». */
export function normalizarWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length === 11 && digitos.startsWith("51") ? digitos.slice(2) : digitos;
}

export const esquemaSolicitud = z
  .object({
    // Paso 1 · Servicio
    servicioId: z.string({ error: "Elige un servicio." }).min(1, "Elige un servicio."),
    conAsesoria: z
      .boolean()
      .optional()
      .transform((v) => v ?? false),
    // Paso 2 · Barbero, día y hora
    barberoId: z.string({ error: "Elige un barbero." }).min(1, "Elige un barbero."),
    fecha: z.iso.date({ error: "Elige un día." }),
    franja: z.enum(FRANJAS, { error: "Elige una franja horaria." }),
    // Paso 3 · Lugar y datos
    lugar: z.enum(["casa", "oficina", "hotel"], { error: "Elige dónde te atendemos." }),
    zonaId: z.string({ error: "Elige el distrito." }).min(1, "Elige el distrito."),
    distritoOtro: z.string().trim().max(80, "Máximo 80 caracteres.").optional(),
    direccion: z
      .string({ error: "Escribe la dirección y una referencia." })
      .trim()
      .min(5, "Escribe la dirección y una referencia.")
      .max(200, "Máximo 200 caracteres."),
    nombre: z
      .string({ error: "Escribe tu nombre." })
      .trim()
      .min(2, "Escribe tu nombre.")
      .max(120, "Máximo 120 caracteres."),
    whatsapp: z
      .string({ error: "Escribe tu número de WhatsApp." })
      .transform(normalizarWhatsapp)
      .pipe(z.string().regex(/^9\d{8}$/, "Escribe tu WhatsApp: 9 dígitos que empiezan con 9.")),
    correo: z
      .string()
      .trim()
      .optional()
      .refine((c) => !c || z.email().safeParse(c).success, "Revisa el correo."),
    consentimientoDatos: z
      .boolean()
      .refine((v) => v, "Necesitamos tu autorización para usar tus datos y gestionar la cita."),
    consentimientoMarketing: z.boolean(),
    /** Trampa para bots: los humanos no ven este campo. */
    sitio: z.string().optional(),
  })
  .refine((d) => d.zonaId !== OTRO_DISTRITO_ID || Boolean(d.distritoOtro), {
    path: ["distritoOtro"],
    message: "Escribe tu distrito.",
    // Corre aunque falten otros campos.
    when: (p) => (p.value as { zonaId?: unknown } | null)?.zonaId === OTRO_DISTRITO_ID,
  });

export type SolicitudEntrada = z.input<typeof esquemaSolicitud>;
export type Solicitud = z.output<typeof esquemaSolicitud>;
export type CampoSolicitud = keyof SolicitudEntrada;
export type ErroresSolicitud = Partial<Record<CampoSolicitud, string>>;

export const CAMPOS_POR_PASO: CampoSolicitud[][] = [
  ["servicioId", "conAsesoria"],
  ["barberoId", "fecha", "franja"],
  ["lugar", "zonaId", "distritoOtro", "direccion", "nombre", "whatsapp", "correo", "consentimientoDatos", "consentimientoMarketing"],
];

export function erroresPorCampo(error: z.ZodError): ErroresSolicitud {
  const errores: ErroresSolicitud = {};
  for (const issue of error.issues) {
    const campo = issue.path[0] as CampoSolicitud | undefined;
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}

/** Día y franja dentro del horario del barbero (también lo valida el servidor). */
export function errorDeDisponibilidad(
  datos: Pick<SolicitudEntrada, "barberoId" | "fecha" | "franja">,
  barberos: Barbero[],
): ErroresSolicitud | null {
  const barbero = barberos.find((b) => b.id === datos.barberoId);
  if (!barbero) return { barberoId: "Elige un barbero." };
  const libres = franjasDisponibles(barbero, datos.fecha);
  if (libres.length === 0) {
    return { fecha: `${barbero.nombre} ${describirDias(barbero.horarios).nota}. Elige otro día.` };
  }
  if (datos.franja && !libres.includes(datos.franja as (typeof libres)[number])) {
    return { franja: "Esa franja no está disponible ese día. Elige otra." };
  }
  return null;
}

/** Lo que devuelve /api/solicitudes y muestra la página de confirmación. */
export type ResumenSolicitud = {
  id: string;
  nombre: string;
  barbero: string;
  servicio: string;
  conAsesoria: boolean;
  totalPen: number;
  fecha: string;
  franja: string;
  lugar: "casa" | "oficina" | "hotel";
  distrito: string;
  revisionZona: boolean;
  creadoEn: string;
};

export type RespuestaSolicitud =
  | { ok: true; resumen: ResumenSolicitud }
  | { ok: false; mensaje: string; errores?: ErroresSolicitud };
