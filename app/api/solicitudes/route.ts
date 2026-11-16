import { after, NextResponse } from "next/server";
import { franjas } from "@/content/zonas";
import { obtenerBarberos, obtenerServicios, obtenerZonas } from "@/lib/catalogo";
import {
  errorDeDisponibilidad,
  erroresPorCampo,
  esquemaSolicitud,
  OTRO_DISTRITO_ID,
  type ErroresSolicitud,
  type RespuestaSolicitud,
} from "@/lib/esquemas/solicitud";
import { avisarCita } from "@/lib/avisos";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/tipos";

// Los tipos generados marcan todos los parámetros como texto; en Postgres los opcionales aceptan null.
type ArgsCrearSolicitud = Database["public"]["Functions"]["crear_solicitud"]["Args"];

const MENSAJE_GENERAL = "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.";

/** Códigos que lanza la base de datos (supabase/migrations/…_reglas.sql) → campo y texto. */
const ERRORES_DB: Record<string, [keyof ErroresSolicitud, string]> = {
  sin_horario: ["fecha", "El barbero no atiende ese día o en esa franja. Elige otro día."],
  fecha_pasada: ["fecha", "Elige una fecha desde hoy."],
  servicio_no_disponible: ["servicioId", "Ese servicio ya no está disponible. Elige otro."],
  servicio_debe_ser_principal: ["servicioId", "La asesoría se pide junto a un servicio principal."],
  asesoria_no_disponible: ["conAsesoria", "La asesoría no está disponible por ahora."],
  zona_no_disponible: ["zonaId", "Por ahora no atendemos ese distrito. Elige «Otro distrito»."],
  falta_consentimiento: ["consentimientoDatos", "Necesitamos tu autorización para usar tus datos y gestionar la cita."],
  clientes_whatsapp_check: ["whatsapp", "Escribe tu WhatsApp: 9 dígitos que empiezan con 9."],
  clientes_nombre_check: ["nombre", "Escribe tu nombre."],
  clientes_correo_check: ["correo", "Revisa el correo."],
  cita_lugar: ["distritoOtro", "Escribe tu distrito."],
};

function responder(cuerpo: RespuestaSolicitud, status: number) {
  return NextResponse.json(cuerpo, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Crea una solicitud de cita. Es la única vía pública para crear clientes y
 * citas: valida con Zod y el horario del barbero, y llama a crear_solicitud
 * con la clave de servicio. La cita queda en «solicitud recibida».
 */
export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ ok: false, mensaje: MENSAJE_GENERAL }, 400);
  }

  const validado = esquemaSolicitud.safeParse(cuerpo);
  if (!validado.success) {
    return responder(
      { ok: false, mensaje: "Revisa los datos marcados.", errores: erroresPorCampo(validado.error) },
      400,
    );
  }
  const d = validado.data;
  if (d.sitio) {
    // Trampa para bots: respuesta neutra, sin crear nada.
    return responder({ ok: false, mensaje: MENSAJE_GENERAL }, 400);
  }
  if (!servidorConfigurado()) {
    return responder({ ok: false, mensaje: "Las reservas en línea aún no están activas. Escríbenos por WhatsApp." }, 503);
  }

  const [servicios, zonas, barberos] = await Promise.all([obtenerServicios(), obtenerZonas(), obtenerBarberos()]);
  const servicio = servicios.find((s) => s.id === d.servicioId && !s.esAdicional);
  if (!servicio) {
    return responder({ ok: false, mensaje: "Revisa los datos marcados.", errores: { servicioId: "Elige un servicio." } }, 400);
  }
  const otroDistrito = d.zonaId === OTRO_DISTRITO_ID;
  const zona = zonas.find((z) => z.id === d.zonaId);
  if (!otroDistrito && !zona) {
    return responder({ ok: false, mensaje: "Revisa los datos marcados.", errores: { zonaId: "Elige el distrito." } }, 400);
  }
  const noDisponible = errorDeDisponibilidad(d, barberos);
  if (noDisponible) {
    return responder({ ok: false, mensaje: "Revisa el día y la hora.", errores: noDisponible }, 409);
  }

  const args = {
    p_nombre: d.nombre,
    p_whatsapp: d.whatsapp,
    p_correo: d.correo || null,
    p_consentimiento_datos: d.consentimientoDatos,
    p_consentimiento_marketing: d.consentimientoMarketing,
    p_barbero: d.barberoId,
    p_servicio: d.servicioId,
    p_con_asesoria: d.conAsesoria,
    p_zona: otroDistrito ? null : d.zonaId,
    p_distrito_otro: otroDistrito ? (d.distritoOtro ?? null) : null,
    p_lugar: d.lugar,
    p_direccion: d.direccion,
    p_referencia: null,
    p_fecha: d.fecha,
    p_franja: d.franja as (typeof franjas)[number]["id"],
    p_origen: "web",
  } as unknown as ArgsCrearSolicitud;
  const { data: cita, error } = await crearClienteServicio().rpc("crear_solicitud", args);

  if (error || !cita) {
    const codigo = Object.keys(ERRORES_DB).find((c) => error?.message?.includes(c));
    if (codigo) {
      const [campo, texto] = ERRORES_DB[codigo];
      return responder({ ok: false, mensaje: "Revisa los datos marcados.", errores: { [campo]: texto } }, 409);
    }
    console.error("crear_solicitud falló", error);
    return responder({ ok: false, mensaje: MENSAJE_GENERAL }, 500);
  }

  // Avisos al cliente («solicitud recibida») y al barbero, sin demorar la respuesta.
  after(() => avisarCita(cita.id, "solicitud_recibida"));

  const barbero = barberos.find((b) => b.id === d.barberoId)!;
  return responder(
    {
      ok: true,
      resumen: {
        id: cita.id,
        nombre: d.nombre,
        barbero: barbero.nombre,
        servicio: servicio.nombre,
        conAsesoria: cita.con_asesoria,
        totalPen: cita.precio_total_pen ?? 0,
        fecha: cita.fecha,
        franja: cita.franja,
        lugar: d.lugar,
        distrito: otroDistrito ? (d.distritoOtro ?? "") : zona!.distrito,
        revisionZona: otroDistrito,
        creadoEn: cita.creado_en,
      },
    },
    201,
  );
}
