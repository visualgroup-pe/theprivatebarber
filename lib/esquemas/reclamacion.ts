import { z } from "zod";

/**
 * Hoja de reclamación virtual (Reglamento del Libro de Reclamaciones,
 * D.S. 011-2011-PCM y modificatorias). Se valida igual en cliente y servidor.
 */
export const TIPOS_DOCUMENTO = ["DNI", "CE", "Pasaporte"] as const;

const texto = (min: number, max: number, mensaje: string) =>
  z.string({ error: mensaje }).trim().min(min, mensaje).max(max, `Máximo ${max} caracteres.`);

export const esquemaReclamacion = z
  .object({
    // 1. Identificación del consumidor reclamante
    nombre: texto(3, 120, "Escribe tu nombre completo."),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO, { error: "Elige el tipo de documento." }),
    numeroDocumento: texto(1, 20, "Escribe tu número de documento."),
    domicilio: texto(5, 200, "Escribe tu domicilio."),
    telefono: z
      .string({ error: "Escribe tu teléfono." })
      .trim()
      .regex(/^\+?[\d\s-]{6,20}$/, "Escribe un teléfono válido, solo con números."),
    correo: z.email({ error: "Escribe un correo válido: ahí te enviamos la copia de tu hoja." }),
    menorDeEdad: z.boolean(),
    apoderado: z.string().trim().max(120, "Máximo 120 caracteres.").optional(),
    // 2. Identificación del bien contratado
    tipoBien: z.enum(["servicio", "producto"], { error: "Indica si es un producto o un servicio." }),
    montoReclamado: z
      .number({ error: "Escribe el monto en soles, solo con números." })
      .min(0, "El monto no puede ser negativo.")
      .max(100000, "Revisa el monto.")
      .optional(),
    descripcionBien: texto(3, 300, "Describe el servicio o producto contratado."),
    // 3. Detalle de la reclamación y pedido del consumidor
    tipo: z.enum(["reclamo", "queja"], { error: "Elige si es un reclamo o una queja." }),
    detalle: texto(10, 3000, "Cuéntanos qué pasó (al menos 10 caracteres)."),
    pedido: texto(5, 1500, "Indica qué solicitas (al menos 5 caracteres)."),
  })
  // Reglas entre campos. `when`: corren en cuanto sus campos están listos,
  // aunque falten otros (así el error del DNI aparece de inmediato).
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
  .refine((d) => !d.menorDeEdad || Boolean(d.apoderado), {
    path: ["apoderado"],
    message: "Si eres menor de edad, escribe el nombre de tu padre, madre o apoderado.",
    when: (p) => typeof (p.value as { menorDeEdad?: unknown })?.menorDeEdad === "boolean",
  });

function documentoListo(v: unknown): boolean {
  const d = v as { tipoDocumento?: unknown; numeroDocumento?: unknown } | null;
  return (
    TIPOS_DOCUMENTO.includes(d?.tipoDocumento as (typeof TIPOS_DOCUMENTO)[number]) &&
    typeof d?.numeroDocumento === "string" &&
    d.numeroDocumento.trim().length > 0
  );
}

export type Reclamacion = z.infer<typeof esquemaReclamacion>;
export type CampoReclamacion = keyof Reclamacion;
export type ErroresReclamacion = Partial<Record<CampoReclamacion, string>>;

/** Convierte el FormData del formulario en el objeto que valida el esquema. */
export function reclamacionDesdeFormData(fd: FormData): Record<string, unknown> {
  const valor = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const monto = valor("montoReclamado")?.replace(",", ".").trim();
  return {
    nombre: valor("nombre"),
    tipoDocumento: valor("tipoDocumento"),
    numeroDocumento: valor("numeroDocumento")?.replace(/\s/g, ""),
    domicilio: valor("domicilio"),
    telefono: valor("telefono"),
    correo: valor("correo")?.trim(),
    menorDeEdad: fd.get("menorDeEdad") === "si",
    apoderado: valor("apoderado")?.trim() || undefined,
    tipoBien: valor("tipoBien"),
    montoReclamado: monto ? Number(monto) : undefined,
    descripcionBien: valor("descripcionBien"),
    tipo: valor("tipo"),
    detalle: valor("detalle"),
    pedido: valor("pedido"),
  };
}

/** Primer mensaje de error por campo. */
export function erroresPorCampo(error: z.ZodError): ErroresReclamacion {
  const errores: ErroresReclamacion = {};
  for (const issue of error.issues) {
    const campo = issue.path[0] as CampoReclamacion | undefined;
    if (campo && !errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}
