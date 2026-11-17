import "server-only";
import type { FranjaId } from "@/content/zonas";
import { nombreRequisito } from "@/lib/convocatoria";
import { LUGARES } from "@/lib/estados";
import { empresa } from "@/lib/empresa";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";
import { avisos } from "./config";
import { enviarCorreo, enviarWhatsapp, registrar, type Resultado } from "./enviar";
import {
  alertaAdmin,
  avisoBarbero,
  avisoCliente,
  avisoPostulacionAdmin,
  avisoReclamacionAdmin,
  copiaReclamacion,
  postulacionRecibida,
  respuestaReclamacion,
  type DatosCita,
  type DatosPostulacion,
  type DatosReclamacion,
  type EventoCliente,
} from "./plantillas";

/**
 * Avisos por WhatsApp y correo. Se llaman con after() para no demorar la
 * respuesta; nunca lanzan errores: un aviso fallido queda registrado en la
 * tabla avisos y en el log, sin afectar la cita.
 */
export type EventoAviso = EventoCliente | "alerta_admin";

async function cargarCita(id: string) {
  const { data } = await crearClienteServicio()
    .from("citas")
    .select(
      `id, estado, fecha, franja, hora_confirmada, con_asesoria, precio_total_pen, lugar, distrito_otro, motivo,
       propuesta_fecha, propuesta_franja, propuesta_hora,
       servicio:servicios (nombre), zona:zonas (distrito), barbero:barberos (nombre, whatsapp),
       cliente:clientes (nombre, whatsapp, correo)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const c = data as unknown as {
    id: string;
    fecha: string;
    franja: FranjaId;
    hora_confirmada: string | null;
    con_asesoria: boolean;
    precio_total_pen: number | null;
    lugar: keyof typeof LUGARES | null;
    distrito_otro: string | null;
    motivo: string | null;
    propuesta_fecha: string | null;
    propuesta_franja: FranjaId | null;
    propuesta_hora: string | null;
    servicio: { nombre: string } | null;
    zona: { distrito: string } | null;
    barbero: { nombre: string; whatsapp: string | null } | null;
    cliente: { nombre: string; whatsapp: string; correo: string | null } | null;
  };
  const datos: DatosCita = {
    id: c.id,
    cliente: c.cliente?.nombre ?? "",
    servicio: c.servicio?.nombre ?? "Servicio",
    conAsesoria: c.con_asesoria,
    totalPen: c.precio_total_pen ?? 0,
    fecha: c.fecha,
    franja: c.franja,
    hora: c.hora_confirmada?.slice(0, 5) ?? null,
    propuesta:
      c.propuesta_fecha && c.propuesta_franja && c.propuesta_hora
        ? { fecha: c.propuesta_fecha, franja: c.propuesta_franja, hora: c.propuesta_hora.slice(0, 5) }
        : null,
    lugar: c.lugar ? LUGARES[c.lugar] : "—",
    distrito: c.zona?.distrito ?? c.distrito_otro ?? "—",
    barbero: c.barbero?.nombre ?? "El barbero",
    motivo: c.motivo,
  };
  return { datos, cliente: c.cliente, barbero: c.barbero };
}

async function porWhatsapp(citaId: string, para: string | null | undefined, plantilla: string, parametros: string[]) {
  if (!para) return;
  const r: Resultado = await enviarWhatsapp(para, plantilla, parametros);
  await registrar({ citaId, canal: "whatsapp", destinatario: para, plantilla }, r);
}

async function porCorreo(
  ref: { citaId?: string; reclamacionId?: string; postulacionId?: string },
  para: string | null | undefined,
  plantilla: string,
  correo: { asunto: string; html: string; texto: string },
): Promise<Resultado | null> {
  if (!para) return null;
  const clave = `${ref.citaId ?? ref.reclamacionId ?? ref.postulacionId}-${plantilla}`;
  const r = await enviarCorreo(para, correo.asunto, correo.html, correo.texto, clave);
  await registrar({ ...ref, canal: "correo", destinatario: para, plantilla }, r);
  return r;
}

/** Avisa a quien corresponda según el momento de la cita. */
export async function avisarCita(citaId: string, evento: EventoAviso): Promise<void> {
  try {
    if (!servidorConfigurado()) return;
    const cita = await cargarCita(citaId);
    if (!cita) return;
    const { datos, cliente, barbero } = cita;
    const url = avisos.sitioUrl;

    if (evento === "alerta_admin") {
      const a = alertaAdmin(datos, avisos.horasSinRespuesta, url);
      await Promise.all([
        porWhatsapp(citaId, avisos.admin.whatsapp, a.whatsapp.plantilla, a.whatsapp.parametros),
        porCorreo({ citaId }, avisos.admin.correo, "alerta_admin", a.correo),
      ]);
      await crearClienteServicio().from("citas").update({ alerta_admin_enviada_en: new Date().toISOString() }).eq("id", citaId);
      return;
    }

    const aviso = avisoCliente(evento, datos, url);
    const tareas: Promise<unknown>[] = [
      porWhatsapp(citaId, cliente?.whatsapp, aviso.whatsapp.plantilla, aviso.whatsapp.parametros),
      porCorreo({ citaId }, cliente?.correo, evento, aviso.correo),
    ];
    // Solicitud nueva: el barbero recibe el aviso con el enlace a su panel.
    if (evento === "solicitud_recibida") {
      const b = avisoBarbero(datos, url);
      tareas.push(porWhatsapp(citaId, barbero?.whatsapp, b.plantilla, b.parametros));
    }
    await Promise.all(tareas);
    if (evento === "recordatorio") {
      await crearClienteServicio().from("citas").update({ recordatorio_enviado_en: new Date().toISOString() }).eq("id", citaId);
    }
  } catch (e) {
    console.error(`avisarCita(${citaId}, ${evento}) falló:`, e);
  }
}

async function cargarReclamacion(id: string): Promise<DatosReclamacion | null> {
  const { data: r } = await crearClienteServicio().from("reclamaciones").select("*").eq("id", id).maybeSingle();
  if (!r) return null;
  return {
    id: r.id,
    correlativo: r.correlativo ?? "",
    creadoEn: r.creado_en,
    nombre: r.nombre,
    documento: `${r.tipo_documento} ${r.numero_documento}`,
    domicilio: r.domicilio,
    telefono: r.telefono,
    correo: r.correo,
    apoderado: r.apoderado,
    tipo: r.tipo,
    bien: `${r.tipo_bien === "servicio" ? "Servicio" : "Producto"}: ${r.descripcion_bien}`,
    monto: r.monto_reclamado != null ? Number(r.monto_reclamado) : null,
    detalle: r.detalle,
    pedido: r.pedido,
    respuesta: r.respuesta,
  };
}

/** Libro de Reclamaciones: copia al consumidor y aviso a la administración; o la respuesta. */
export async function avisarReclamacion(id: string, evento: "registrada" | "respondida"): Promise<void> {
  try {
    if (!servidorConfigurado()) return;
    const r = await cargarReclamacion(id);
    if (!r) return;
    const ref = { reclamacionId: id };
    const proveedor = `${empresa.marca} (${empresa.razonSocial}, RUC ${empresa.ruc})`;
    if (evento === "registrada") {
      const [copia] = await Promise.all([
        porCorreo(ref, r.correo, "reclamacion_copia", copiaReclamacion(r, avisos.sitioUrl, proveedor)),
        porCorreo(ref, avisos.admin.correo, "reclamacion_admin", avisoReclamacionAdmin(r, avisos.sitioUrl)),
      ]);
      if (copia?.estado === "enviado") {
        await crearClienteServicio().from("reclamaciones").update({ copia_enviada_en: new Date().toISOString() }).eq("id", id);
      }
    } else {
      await porCorreo(ref, r.correo, "reclamacion_respuesta", respuestaReclamacion(r, avisos.sitioUrl));
    }
  } catch (e) {
    console.error(`avisarReclamacion(${id}, ${evento}) falló:`, e);
  }
}

/** Convocatoria: aviso a la administración y acuse al postulante (si dejó correo). */
export async function avisarPostulacion(id: string): Promise<void> {
  try {
    if (!servidorConfigurado()) return;
    const { data: p } = await crearClienteServicio()
      .from("postulaciones")
      .select("id, nombre, whatsapp, correo, anos_oficio, zonas, cumple_requisitos, requisitos_faltantes")
      .eq("id", id)
      .maybeSingle();
    if (!p) return;
    const datos: DatosPostulacion = {
      id: p.id,
      nombre: p.nombre,
      whatsapp: p.whatsapp,
      correo: p.correo,
      anosOficio: p.anos_oficio,
      zonas: p.zonas,
      cumple: p.cumple_requisitos,
      faltan: p.requisitos_faltantes.map(nombreRequisito),
    };
    const ref = { postulacionId: id };
    await Promise.all([
      porCorreo(ref, avisos.admin.correo, "postulacion_admin", avisoPostulacionAdmin(datos, avisos.sitioUrl)),
      porCorreo(ref, p.correo, "postulacion_recibida", postulacionRecibida(datos, avisos.sitioUrl)),
    ]);
  } catch (e) {
    console.error(`avisarPostulacion(${id}) falló:`, e);
  }
}
