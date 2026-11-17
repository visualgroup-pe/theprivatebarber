import { z } from "zod";
import { FOTOS_MAXIMAS, MOVILIDAD, TECNICAS } from "@/content/convocatoria";
import { normalizarWhatsapp } from "./solicitud";

/**
 * Postulación a la convocatoria de barberos. Mismo esquema en el navegador y
 * en la acción del servidor; la base de datos vuelve a validar los formatos.
 */
export const TIPOS_DOCUMENTO_POSTULACION = ["DNI", "CE"] as const;
const FRANJAS = ["manana", "mediodia", "tarde", "noche"] as const;

const texto = (min: number, max: number, mensaje: string) =>
  z.string({ error: mensaje }).trim().min(min, mensaje).max(max, `Máximo ${max} caracteres.`);
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => v || undefined);

export const esquemaPostulacion = z
  .object({
    // 01 · Tus datos
    nombre: texto(3, 120, "Escribe tu nombre completo."),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO_POSTULACION, {
      error: "Elige el tipo de documento.",
    }),
    numeroDocumento: texto(1, 20, "Escribe tu número de documento."),
    whatsapp: z
      .string({ error: "Escribe tu WhatsApp." })
      .transform(normalizarWhatsapp)
      .pipe(z.string().regex(/^9\d{8}$/, "Escribe tu WhatsApp: 9 dígitos que empiezan con 9.")),
    correo: z
      .union([z.literal(""), z.email({ error: "Revisa el correo." })])
      .optional()
      .transform((v) => v || undefined),
    distritoResidencia: texto(2, 80, "Escribe el distrito donde vives."),
    // 02 · Tu oficio
    anosOficio: z
      .number({ error: "Escribe tus años de oficio, solo con números." })
      .int("Escribe un número entero.")
      .min(0, "Revisa los años.")
      .max(60, "Revisa los años."),
    tecnicas: z.array(z.enum(TECNICAS.map((t) => t.id) as [string, ...string[]])),
    especialidad: opcional(160),
    experiencia: texto(20, 2000, "Cuéntanos dónde has trabajado y con qué clientes (al menos 20 caracteres)."),
    experienciaDomicilio: z.boolean(),
    // 03 · Tus trabajos
    instagram: opcional(200),
    fotos: z.array(z.string().regex(/^[0-9a-f-]{36}\/\d+\.jpg$/)).max(FOTOS_MAXIMAS, `Máximo ${FOTOS_MAXIMAS} fotos.`),
    // 04 · Disponibilidad
    dias: z.array(z.number().int().min(1).max(7)).min(1, "Elige al menos un día."),
    franjas: z.array(z.enum(FRANJAS)).min(1, "Elige al menos una franja."),
    zonas: z.array(z.string().max(80)).max(20),
    movilidad: z.enum(MOVILIDAD.map((m) => m.id) as [string, ...string[]], {
      error: "Cuéntanos cómo te movilizas.",
    }),
    // 05 · Compromisos
    herramientasPropias: z.boolean(),
    compromisoHigiene: z.boolean(),
    compromisoPuntualidad: z.boolean(),
    mensaje: opcional(2000),
    consentimientoDatos: z.literal(true, {
      error: "Necesitamos tu autorización para usar tus datos y evaluar tu postulación.",
    }),
  })
  .refine((d) => d.tipoDocumento !== "DNI" || /^\d{8}$/.test(d.numeroDocumento), {
    path: ["numeroDocumento"],
    message: "El DNI tiene 8 dígitos.",
    when: (p) => documentoListo(p.value),
  })
  .refine((d) => d.tipoDocumento === "DNI" || /^[A-Za-z0-9]{5,20}$/.test(d.numeroDocumento), {
    path: ["numeroDocumento"],
    message: "Revisa el número: entre 5 y 20 letras o números.",
    when: (p) => documentoListo(p.value),
  })
  .refine((d) => d.fotos.length > 0 || Boolean(d.instagram), {
    path: ["fotos"],
    message: "Sube fotos de tus trabajos o escribe tu Instagram.",
    when: (p) => {
      const v = p.value as { fotos?: unknown } | null;
      return Array.isArray(v?.fotos);
    },
  });

function documentoListo(v: unknown): boolean {
  const d = v as { tipoDocumento?: unknown; numeroDocumento?: unknown } | null;
  return (
    TIPOS_DOCUMENTO_POSTULACION.includes(d?.tipoDocumento as (typeof TIPOS_DOCUMENTO_POSTULACION)[number]) &&
    typeof d?.numeroDocumento === "string" &&
    d.numeroDocumento.trim().length > 0
  );
}

export type Postulacion = z.output<typeof esquemaPostulacion>;
export type CampoPostulacion = keyof Postulacion;
export type ErroresPostulacion = Partial<Record<CampoPostulacion, string>>;

export function erroresPorCampo(error: z.ZodError): ErroresPostulacion {
  const errores: ErroresPostulacion = {};
  for (const i of error.issues) {
    const campo = i.path[0] as CampoPostulacion | undefined;
    if (campo && !errores[campo]) errores[campo] = i.message;
  }
  return errores;
}

/** Convierte el FormData del formulario en el objeto que valida el esquema. */
export function postulacionDesdeFormData(fd: FormData): Record<string, unknown> {
  const valor = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const lista = (k: string) => fd.getAll(k).filter((v): v is string => typeof v === "string" && v !== "");
  const anos = valor("anosOficio")?.trim();
  return {
    nombre: valor("nombre"),
    tipoDocumento: valor("tipoDocumento"),
    numeroDocumento: valor("numeroDocumento")?.replace(/\s/g, ""),
    whatsapp: valor("whatsapp"),
    correo: valor("correo")?.trim(),
    distritoResidencia: valor("distritoResidencia"),
    anosOficio: anos ? Number(anos) : undefined,
    tecnicas: lista("tecnicas"),
    especialidad: valor("especialidad"),
    experiencia: valor("experiencia"),
    experienciaDomicilio: fd.get("experienciaDomicilio") === "si",
    instagram: valor("instagram"),
    fotos: lista("fotos"),
    dias: lista("dias").map(Number),
    franjas: lista("franjas"),
    zonas: lista("zonas"),
    movilidad: valor("movilidad"),
    herramientasPropias: fd.get("herramientasPropias") === "si",
    compromisoHigiene: fd.get("compromisoHigiene") === "si",
    compromisoPuntualidad: fd.get("compromisoPuntualidad") === "si",
    mensaje: valor("mensaje"),
    consentimientoDatos: fd.get("consentimientoDatos") === "si",
  };
}
