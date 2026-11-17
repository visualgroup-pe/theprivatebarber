"use server";

import { after } from "next/server";
import { avisarPostulacion } from "@/lib/avisos";
import { leerZonas } from "@/lib/catalogo";
import { BUCKET_POSTULACIONES, evaluarPostulacion } from "@/lib/convocatoria";
import {
  erroresPorCampo,
  esquemaPostulacion,
  postulacionDesdeFormData,
  type ErroresPostulacion,
} from "@/lib/esquemas/postulacion";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";

export type EstadoPostulacion =
  | { estado: "inicial" }
  | {
      estado: "errores";
      errores: ErroresPostulacion;
      valores: Record<string, string | string[]>;
    }
  | {
      estado: "no-disponible";
      mensaje: string;
      valores: Record<string, string | string[]>;
    }
  | { estado: "enviada"; nombre: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function valoresDe(fd: FormData): Record<string, string | string[]> {
  const valores: Record<string, string | string[]> = {};
  for (const k of new Set(fd.keys())) {
    if (k.startsWith("$ACTION")) continue;
    const todos = fd.getAll(k).filter((v): v is string => typeof v === "string");
    valores[k] =
      todos.length > 1 || ["tecnicas", "dias", "franjas", "zonas", "fotos"].includes(k) ? todos : (todos[0] ?? "");
  }
  return valores;
}

/**
 * Registra una postulación: valida, comprueba las fotos subidas, la evalúa
 * contra los requisitos publicados y avisa a la administración.
 */
export async function postular(_previo: EstadoPostulacion, fd: FormData): Promise<EstadoPostulacion> {
  // Trampa para bots: un campo oculto que una persona no completa.
  if (typeof fd.get("sitio") === "string" && fd.get("sitio") !== "") {
    return {
      estado: "no-disponible",
      mensaje: "No pudimos enviar tu postulación. Inténtalo de nuevo.",
      valores: {},
    };
  }

  const resultado = esquemaPostulacion.safeParse(postulacionDesdeFormData(fd));
  if (!resultado.success) {
    return {
      estado: "errores",
      errores: erroresPorCampo(resultado.error),
      valores: valoresDe(fd),
    };
  }
  if (!servidorConfigurado()) {
    return {
      estado: "no-disponible",
      mensaje: "La postulación en línea todavía no está activa. Escríbenos por WhatsApp.",
      valores: valoresDe(fd),
    };
  }

  const d = resultado.data;
  const s = crearClienteServicio();
  const idForm = fd.get("id");
  const id = typeof idForm === "string" && UUID.test(idForm) ? idForm : crypto.randomUUID();

  // Solo cuentan las fotos que de verdad están en la carpeta de esta postulación;
  // las que se subieron y luego se quitaron, se borran.
  const almacen = s.storage.from(BUCKET_POSTULACIONES);
  const { data: archivos } = await almacen.list(id, { limit: 100 });
  const subidas = new Set((archivos ?? []).map((a) => `${id}/${a.name}`));
  const fotos = d.fotos.filter((f) => subidas.has(f));
  const sobrantes = [...subidas].filter((f) => !fotos.includes(f));
  if (sobrantes.length) await almacen.remove(sobrantes);
  if (fotos.length === 0 && !d.instagram) {
    return {
      estado: "errores",
      errores: {
        fotos: "No recibimos tus fotos. Súbelas de nuevo o escribe tu Instagram.",
      },
      valores: valoresDe(fd),
    };
  }

  // Solo distritos en los que atendemos.
  const activas = new Set((await leerZonas()).map((z) => z.distrito));
  const zonas = d.zonas.filter((z) => activas.has(z));

  const evaluacion = evaluarPostulacion({ ...d, fotos: fotos.length, zonas });
  const { error } = await s.from("postulaciones").insert({
    id,
    nombre: d.nombre,
    tipo_documento: d.tipoDocumento,
    numero_documento: d.numeroDocumento.toUpperCase(),
    whatsapp: d.whatsapp,
    correo: d.correo ?? null,
    distrito_residencia: d.distritoResidencia,
    anos_oficio: d.anosOficio,
    tecnicas: d.tecnicas,
    especialidad: d.especialidad ?? null,
    experiencia: d.experiencia,
    experiencia_domicilio: d.experienciaDomicilio,
    instagram: d.instagram ?? null,
    fotos,
    dias: d.dias,
    franjas: d.franjas,
    zonas,
    movilidad: d.movilidad,
    herramientas_propias: d.herramientasPropias,
    compromiso_higiene: d.compromisoHigiene,
    compromiso_puntualidad: d.compromisoPuntualidad,
    mensaje: d.mensaje ?? null,
    consentimiento_datos: true,
    cumple_requisitos: evaluacion.cumple,
    requisitos_faltantes: evaluacion.faltan,
  });

  if (error) {
    console.error("No se pudo registrar la postulación", error);
    return {
      estado: "no-disponible",
      mensaje: "No pudimos enviar tu postulación en este momento. Inténtalo de nuevo en unos minutos.",
      valores: valoresDe(fd),
    };
  }

  after(() => avisarPostulacion(id));
  return { estado: "enviada", nombre: d.nombre.split(/\s+/)[0] };
}
