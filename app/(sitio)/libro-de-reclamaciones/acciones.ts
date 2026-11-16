"use server";

import {
  erroresPorCampo,
  esquemaReclamacion,
  reclamacionDesdeFormData,
  type ErroresReclamacion,
} from "@/lib/esquemas/reclamacion";

export type EstadoReclamacion =
  | { estado: "inicial" }
  | { estado: "errores"; errores: ErroresReclamacion; valores: Record<string, string> }
  | { estado: "no-disponible"; mensaje: string; valores: Record<string, string> }
  | { estado: "registrada"; correlativo: string; correo: string };

function valoresDe(fd: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === "string" && !k.startsWith("$ACTION")) valores[k] = v;
  });
  return valores;
}

/**
 * Registra una hoja de reclamación. Valida con el mismo esquema que el cliente.
 * Etapa 3: el registro con número correlativo y la copia por correo se
 * conectan en las etapas 4 (Supabase) y 7 (Resend).
 */
export async function registrarReclamacion(
  _previo: EstadoReclamacion,
  fd: FormData,
): Promise<EstadoReclamacion> {
  const resultado = esquemaReclamacion.safeParse(reclamacionDesdeFormData(fd));
  if (!resultado.success) {
    return { estado: "errores", errores: erroresPorCampo(resultado.error), valores: valoresDe(fd) };
  }

  // TODO etapa 4: insertar en `reclamaciones` con correlativo (NNNN-AAAA).
  // TODO etapa 7: enviar la copia de la hoja al correo del consumidor.
  return {
    estado: "no-disponible",
    mensaje:
      "El registro en línea todavía no está activo. Tus datos están completos: por ahora, envíanos tu reclamo por correo o WhatsApp.",
    valores: valoresDe(fd),
  };
}
