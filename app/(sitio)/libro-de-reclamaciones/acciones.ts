"use server";

import {
  erroresPorCampo,
  esquemaReclamacion,
  reclamacionDesdeFormData,
  type ErroresReclamacion,
} from "@/lib/esquemas/reclamacion";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";

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
 * Registra una hoja de reclamación con su número correlativo (lo asigna la
 * base de datos). Valida con el mismo esquema que el cliente.
 */
export async function registrarReclamacion(
  _previo: EstadoReclamacion,
  fd: FormData,
): Promise<EstadoReclamacion> {
  const resultado = esquemaReclamacion.safeParse(reclamacionDesdeFormData(fd));
  if (!resultado.success) {
    return { estado: "errores", errores: erroresPorCampo(resultado.error), valores: valoresDe(fd) };
  }

  if (!servidorConfigurado()) {
    return {
      estado: "no-disponible",
      mensaje:
        "El registro en línea todavía no está activo. Tus datos están completos: por ahora, envíanos tu reclamo por correo o WhatsApp.",
      valores: valoresDe(fd),
    };
  }

  const d = resultado.data;
  const { data, error } = await crearClienteServicio()
    .from("reclamaciones")
    .insert({
      nombre: d.nombre,
      tipo_documento: d.tipoDocumento,
      numero_documento: d.numeroDocumento,
      domicilio: d.domicilio,
      telefono: d.telefono,
      correo: d.correo,
      menor_de_edad: d.menorDeEdad,
      apoderado: d.menorDeEdad ? (d.apoderado ?? null) : null,
      tipo_bien: d.tipoBien,
      monto_reclamado: d.montoReclamado ?? null,
      descripcion_bien: d.descripcionBien,
      tipo: d.tipo,
      detalle: d.detalle,
      pedido: d.pedido,
      // anio y numero los asigna el trigger reclamaciones_numerar
      anio: 0,
      numero: 0,
    })
    .select("correlativo")
    .single();

  if (error || !data?.correlativo) {
    console.error("No se pudo registrar la reclamación", error);
    return {
      estado: "no-disponible",
      mensaje: "No pudimos registrar tu hoja en este momento. Inténtalo de nuevo en unos minutos o escríbenos por correo.",
      valores: valoresDe(fd),
    };
  }

  // TODO etapa 7: enviar la copia de la hoja al correo del consumidor (Resend).
  return { estado: "registrada", correlativo: data.correlativo, correo: d.correo };
}
