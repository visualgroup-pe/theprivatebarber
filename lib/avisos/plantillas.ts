import type { FranjaId } from "@/content/zonas";
import { fechaLarga, franjaTexto } from "@/lib/disponibilidad";
import { soles } from "@/lib/tokens";
import { HORAS_CAMBIO_SIN_COSTO } from "@/content/politicas";
import { correoDeMarca, type Correo } from "./correo-html";

/**
 * Textos de los avisos. Las plantillas de WhatsApp deben enviarse a
 * aprobación de Meta (categoría «Utilidad») con estos nombres, cuerpos y
 * variables {{n}} en el mismo orden: ver docs/plantillas-whatsapp.md.
 */
export const PLANTILLAS_WHATSAPP = {
  tpb_solicitud_recibida: {
    para: "Cliente",
    cuerpo:
      "Hola {{1}}, recibimos tu solicitud de cita en The Private Barber: {{2}}, {{3}}, en {{4}}. Tu cita aún no está confirmada: te escribiremos en cuanto {{5}} la acepte.",
    ejemplo: ["Andrés", "Corte y barba + asesoría", "jueves 10 de diciembre, tarde (15–18)", "San Isidro", "Nilber"],
  },
  tpb_cita_confirmada: {
    para: "Cliente",
    cuerpo:
      "Hola {{1}}, tu cita está confirmada: {{2}}, {{3}} a las {{4}}, en {{5}}. Te atiende {{6}}. Total: {{7}}, IGV incluido. Puedes reprogramar o cancelar sin costo hasta 2 horas antes, respondiendo a este mensaje.",
    ejemplo: ["Andrés", "Corte y barba + asesoría", "jueves 10 de diciembre", "15:30", "San Isidro", "Nilber", "S/ 350"],
  },
  tpb_nuevo_horario: {
    para: "Cliente",
    cuerpo:
      "Hola {{1}}, {{2}} no puede atenderte en el horario que pediste y te propone {{3}} a las {{4}}. Responde a este mensaje para aceptarlo o pedir otro.",
    ejemplo: ["Andrés", "Nilber", "jueves 17 de diciembre", "19:00"],
  },
  tpb_cita_rechazada: {
    para: "Cliente",
    cuerpo:
      "Hola {{1}}, lo sentimos: no podemos atender tu solicitud del {{2}}. {{3}} Si quieres, responde a este mensaje y buscamos otra fecha.",
    ejemplo: ["Andrés", "jueves 10 de diciembre", "Ese día no tenemos disponibilidad en tu distrito."],
  },
  tpb_cita_cancelada: {
    para: "Cliente",
    cuerpo: "Hola {{1}}, tu cita del {{2}} quedó cancelada. {{3}} Para reservar otra fecha, responde a este mensaje.",
    ejemplo: ["Andrés", "jueves 10 de diciembre", "Gracias por avisarnos."],
  },
  tpb_recordatorio: {
    para: "Cliente",
    cuerpo:
      "Hola {{1}}, te recordamos tu cita de mañana: {{2}} a las {{3}}, en {{4}}. Ten listo un espacio con buena luz, una silla y un enchufe cerca.",
    ejemplo: ["Andrés", "Corte y barba", "15:30", "San Isidro"],
  },
  tpb_barbero_nueva_solicitud: {
    para: "Barbero",
    cuerpo: "Nueva solicitud: {{1}}, {{2}}, en {{3}}. Revísala y respóndela en tu panel: {{4}}",
    ejemplo: ["Corte y barba + asesoría", "jueves 10 de diciembre, tarde (15–18)", "San Isidro", "https://[dominio]/barbero/cita/…"],
  },
  tpb_admin_sin_respuesta: {
    para: "Administración",
    cuerpo: "La solicitud de {{1}} para el {{2}} lleva más de {{3}} horas sin respuesta de {{4}}. Revísala: {{5}}",
    ejemplo: ["Andrés", "jueves 10 de diciembre", "4", "Nilber", "https://[dominio]/admin/citas/…"],
  },
} as const;

export type NombrePlantilla = keyof typeof PLANTILLAS_WHATSAPP;
export type MensajeWhatsapp = { plantilla: NombrePlantilla; parametros: string[] };

export type DatosCita = {
  id: string;
  cliente: string;
  servicio: string;
  conAsesoria: boolean;
  totalPen: number;
  fecha: string;
  franja: FranjaId;
  hora: string | null;
  propuesta: { fecha: string; franja: FranjaId; hora: string } | null;
  lugar: string;
  distrito: string;
  barbero: string;
  motivo: string | null;
};

const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? n;
const minus = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const dia = (f: string) => minus(fechaLarga(f));
const servicio = (d: DatosCita) => `${d.servicio}${d.conAsesoria ? " + asesoría" : ""}`;
const cuando = (d: DatosCita) => `${dia(d.fecha)}, ${minus(franjaTexto(d.franja, false))} (${franjaTexto(d.franja).split(" · ")[1]})`;

export type EventoCliente = "solicitud_recibida" | "confirmada" | "reprogramacion" | "rechazada" | "cancelada" | "recordatorio";

/** Aviso al cliente por WhatsApp y por correo para cada momento de la cita. */
export function avisoCliente(evento: EventoCliente, d: DatosCita, sitioUrl: string): { whatsapp: MensajeWhatsapp; correo: Correo } {
  const nombre = primerNombre(d.cliente);
  const filas: Array<[string, string]> = [
    ["Servicio", servicio(d)],
    ["Día", fechaLarga(d.fecha)],
    ["Hora", d.hora ?? `Por confirmar · ${franjaTexto(d.franja)}`],
    ["Lugar", `${d.lugar} · ${d.distrito}`],
    ["Barbero", d.barbero],
    ["Total", `${soles(d.totalPen)} · IGV incluido`],
  ];
  const base = { sitioUrl, filas };

  switch (evento) {
    case "solicitud_recibida":
      return {
        whatsapp: { plantilla: "tpb_solicitud_recibida", parametros: [nombre, servicio(d), cuando(d), d.distrito, d.barbero] },
        correo: correoDeMarca("Recibimos tu solicitud de cita", {
          ...base,
          preencabezado: `Tu cita aún no está confirmada: te escribiremos cuando ${d.barbero} la acepte.`,
          etiqueta: "Solicitud recibida",
          titulo: `Gracias, ${nombre}.`,
          tituloAcento: `Ya la tiene ${d.barbero}.`,
          parrafos: ["Tu cita aún no está confirmada. Te escribiremos por WhatsApp en cuanto el barbero la acepte y fije la hora exacta."],
        }),
      };
    case "confirmada":
      return {
        whatsapp: {
          plantilla: "tpb_cita_confirmada",
          parametros: [nombre, servicio(d), dia(d.fecha), d.hora ?? "", d.distrito, d.barbero, soles(d.totalPen)],
        },
        correo: correoDeMarca("Tu cita está confirmada", {
          ...base,
          preencabezado: `${fechaLarga(d.fecha)} a las ${d.hora} con ${d.barbero}.`,
          etiqueta: "Cita confirmada",
          titulo: `${fechaLarga(d.fecha)},`,
          tituloAcento: `a las ${d.hora}.`,
          parrafos: [
            `${d.barbero} llegará a tu dirección con todo lo necesario. Ten listo un espacio con buena luz, una silla y un enchufe cerca.`,
          ],
          nota: `Puedes reprogramar o cancelar sin costo hasta ${HORAS_CAMBIO_SIN_COSTO} horas antes: responde a este correo o escríbenos por WhatsApp.`,
        }),
      };
    case "reprogramacion": {
      const p = d.propuesta!;
      return {
        whatsapp: { plantilla: "tpb_nuevo_horario", parametros: [nombre, d.barbero, dia(p.fecha), p.hora] },
        correo: correoDeMarca("Te proponemos otro horario", {
          sitioUrl,
          preencabezado: `${d.barbero} te propone ${dia(p.fecha)} a las ${p.hora}.`,
          etiqueta: "Nuevo horario propuesto",
          titulo: `${fechaLarga(p.fecha)},`,
          tituloAcento: `a las ${p.hora}.`,
          parrafos: [
            `${d.barbero} no puede atenderte en el horario que pediste (${cuando(d)}) y te propone este. Responde a este correo o escríbenos por WhatsApp para aceptarlo o pedir otro.`,
            ...(d.motivo ? [d.motivo] : []),
          ],
          filas: [
            ["Servicio", servicio(d)],
            ["Lugar", `${d.lugar} · ${d.distrito}`],
            ["Total", `${soles(d.totalPen)} · IGV incluido`],
          ],
        }),
      };
    }
    case "rechazada":
      return {
        whatsapp: {
          plantilla: "tpb_cita_rechazada",
          parametros: [nombre, dia(d.fecha), d.motivo ? `${d.motivo.replace(/\.?$/, ".")}` : "Gracias por escribirnos."],
        },
        correo: correoDeMarca("No podemos atender tu solicitud", {
          sitioUrl,
          preencabezado: "Si quieres, buscamos otra fecha.",
          etiqueta: "Solicitud no confirmada",
          titulo: "Lo sentimos,",
          tituloAcento: "esta vez no podemos.",
          parrafos: [
            `No podemos atender tu solicitud del ${cuando(d)}.`,
            ...(d.motivo ? [d.motivo] : []),
            "Si quieres, responde a este correo o escríbenos por WhatsApp y buscamos otra fecha.",
          ],
          boton: { texto: "Elegir otra fecha", url: `${sitioUrl}/#reserva` },
        }),
      };
    case "cancelada":
      return {
        whatsapp: { plantilla: "tpb_cita_cancelada", parametros: [nombre, dia(d.fecha), d.motivo ?? "Gracias por avisarnos."] },
        correo: correoDeMarca("Tu cita quedó cancelada", {
          sitioUrl,
          preencabezado: `Cita del ${dia(d.fecha)} cancelada.`,
          etiqueta: "Cita cancelada",
          titulo: "Tu cita",
          tituloAcento: "quedó cancelada.",
          parrafos: [`La cita del ${cuando(d)} quedó cancelada.`, ...(d.motivo ? [d.motivo] : [])],
          boton: { texto: "Reservar otra fecha", url: `${sitioUrl}/#reserva` },
        }),
      };
    case "recordatorio":
      return {
        whatsapp: { plantilla: "tpb_recordatorio", parametros: [nombre, servicio(d), d.hora ?? "", d.distrito] },
        correo: correoDeMarca("Tu cita es mañana", {
          ...base,
          preencabezado: `Mañana a las ${d.hora} con ${d.barbero}.`,
          etiqueta: "Recordatorio",
          titulo: "Mañana,",
          tituloAcento: `a las ${d.hora}.`,
          parrafos: ["Ten listo un espacio con buena luz, una silla y un enchufe cerca. El barbero lleva todo lo demás."],
          nota: "Si necesitas cambiar algo, responde a este correo o escríbenos por WhatsApp.",
        }),
      };
  }
}

/** Aviso al barbero de una solicitud nueva, con enlace a su panel. */
export function avisoBarbero(d: DatosCita, sitioUrl: string): MensajeWhatsapp {
  return {
    plantilla: "tpb_barbero_nueva_solicitud",
    parametros: [servicio(d), cuando(d), d.distrito, `${sitioUrl}/barbero/cita/${d.id}`],
  };
}

/** Alerta a la administración: el barbero no respondió a tiempo. */
export function alertaAdmin(d: DatosCita, horas: number, sitioUrl: string): { whatsapp: MensajeWhatsapp; correo: Correo } {
  const url = `${sitioUrl}/admin/citas/${d.id}`;
  return {
    whatsapp: { plantilla: "tpb_admin_sin_respuesta", parametros: [primerNombre(d.cliente), dia(d.fecha), String(horas), d.barbero, url] },
    correo: correoDeMarca(`Solicitud sin respuesta: ${d.cliente}`, {
      sitioUrl,
      preencabezado: `${d.barbero} no respondió en ${horas} horas.`,
      etiqueta: "Alerta",
      titulo: `${horas} horas`,
      tituloAcento: "sin respuesta.",
      parrafos: [`La solicitud de ${d.cliente} para ${d.barbero} sigue sin respuesta.`],
      filas: [
        ["Servicio", servicio(d)],
        ["Día", cuando(d)],
        ["Lugar", `${d.lugar} · ${d.distrito}`],
      ],
      boton: { texto: "Ver la solicitud", url },
    }),
  };
}

// ── Libro de Reclamaciones ────────────────────────────────────────

export type DatosReclamacion = {
  id: string;
  correlativo: string;
  creadoEn: string;
  nombre: string;
  documento: string;
  domicilio: string;
  telefono: string;
  correo: string;
  apoderado: string | null;
  tipo: "reclamo" | "queja";
  bien: string;
  monto: number | null;
  detalle: string;
  pedido: string;
  respuesta: string | null;
};

function filasReclamacion(r: DatosReclamacion): Array<[string, string]> {
  return [
    ["Hoja N.°", r.correlativo],
    ["Fecha", new Date(r.creadoEn).toLocaleString("es-PE", { timeZone: "America/Lima" })],
    ["Consumidor", r.nombre],
    ["Documento", r.documento],
    ["Domicilio", r.domicilio],
    ["Teléfono", r.telefono],
    ["Correo", r.correo],
    ...(r.apoderado ? ([["Padre, madre o apoderado", r.apoderado]] as Array<[string, string]>) : []),
    ["Tipo", r.tipo === "reclamo" ? "Reclamo" : "Queja"],
    ["Bien contratado", `${r.bien}${r.monto != null ? ` · ${soles(r.monto)}` : ""}`],
    ["Detalle", r.detalle],
    ["Pedido", r.pedido],
  ];
}

export function copiaReclamacion(r: DatosReclamacion, sitioUrl: string, proveedor: string): Correo {
  return correoDeMarca(`Copia de tu hoja de reclamación N.° ${r.correlativo}`, {
    sitioUrl,
    preencabezado: "Te responderemos en un plazo no mayor a 15 días hábiles.",
    etiqueta: "Libro de Reclamaciones",
    titulo: "Hoja de reclamación",
    tituloAcento: `N.° ${r.correlativo}`,
    parrafos: [
      `Esta es la copia de tu hoja registrada en el Libro de Reclamaciones virtual de ${proveedor}. Te responderemos en un plazo no mayor a quince (15) días hábiles.`,
    ],
    filas: filasReclamacion(r),
    nota: "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
  });
}

export function avisoReclamacionAdmin(r: DatosReclamacion, sitioUrl: string): Correo {
  return correoDeMarca(`Nueva hoja de reclamación N.° ${r.correlativo}`, {
    sitioUrl,
    preencabezado: `${r.tipo === "reclamo" ? "Reclamo" : "Queja"} de ${r.nombre}. Plazo: 15 días hábiles.`,
    etiqueta: "Libro de Reclamaciones",
    titulo: `${r.tipo === "reclamo" ? "Nuevo reclamo" : "Nueva queja"}`,
    tituloAcento: `N.° ${r.correlativo}`,
    parrafos: ["El plazo para responder es de 15 días hábiles."],
    filas: filasReclamacion(r),
    boton: { texto: "Responder", url: `${sitioUrl}/admin/reclamaciones` },
  });
}

export function respuestaReclamacion(r: DatosReclamacion, sitioUrl: string): Correo {
  return correoDeMarca(`Respuesta a tu hoja de reclamación N.° ${r.correlativo}`, {
    sitioUrl,
    preencabezado: "Respuesta del proveedor a tu hoja de reclamación.",
    etiqueta: "Libro de Reclamaciones",
    titulo: "Nuestra respuesta",
    tituloAcento: `N.° ${r.correlativo}`,
    parrafos: (r.respuesta ?? "").split(/\n{2,}/).filter(Boolean),
    filas: [
      ["Tipo", r.tipo === "reclamo" ? "Reclamo" : "Queja"],
      ["Detalle", r.detalle],
      ["Pedido", r.pedido],
    ],
  });
}
