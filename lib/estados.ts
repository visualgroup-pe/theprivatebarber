/** Nombres y tonos de los estados de una cita para los paneles. */
import type { Database } from "@/lib/supabase/tipos";

export type EstadoCita = Database["public"]["Enums"]["estado_cita"];

export const ESTADOS: Record<EstadoCita, { nombre: string; clase: string }> = {
  solicitud_recibida: { nombre: "Solicitud recibida", clase: "border-huaca bg-huaca text-lino" },
  pendiente: { nombre: "En revisión", clase: "border-huaca text-huaca-profundo" },
  reprogramacion: { nombre: "Nuevo horario propuesto", clase: "border-tabaco text-tabaco border-dashed" },
  confirmada: { nombre: "Confirmada", clase: "border-obsidiana bg-obsidiana text-lino" },
  completada: { nombre: "Completada", clase: "border-obsidiana/40 text-tabaco" },
  rechazada: { nombre: "Rechazada", clase: "border-obsidiana/30 text-tabaco line-through" },
  cancelada: { nombre: "Cancelada", clase: "border-obsidiana/30 text-tabaco line-through" },
};

export const ESTADOS_ABIERTOS: EstadoCita[] = ["solicitud_recibida", "pendiente", "reprogramacion", "confirmada"];
export const POR_RESPONDER: EstadoCita[] = ["solicitud_recibida", "pendiente"];

export const LUGARES = { casa: "Casa", oficina: "Oficina", hotel: "Hotel" } as const;

/** Mensajes para los códigos de error de la base de datos (reglas de las citas). */
export const ERRORES_CITA: Record<string, string> = {
  falta_hora: "Elige la hora exacta de la visita.",
  hora_fuera_de_franja: "La hora debe estar dentro de la franja que pidió el cliente.",
  falta_propuesta: "Para proponer otro horario, elige día, franja y hora.",
  sin_horario: "Ese día o franja no está en el horario del barbero.",
  fecha_pasada: "Elige una fecha desde hoy.",
  transicion_invalida: "Esa acción ya no es posible en el estado actual de la cita.",
  transicion_no_permitida: "Esa decisión le corresponde al cliente o a la administración.",
  campos_no_permitidos: "No tienes permiso para cambiar esos datos.",
  cita_no_encontrada: "No encontramos la cita o no tienes acceso a ella.",
  sin_permiso: "No tienes permiso para hacer esto.",
  servicio_debe_ser_principal: "La asesoría solo va junto a un servicio principal.",
  falta_consentimiento: "Confirma que el cliente autorizó el uso de sus datos.",
};

export function mensajeDeError(mensaje: string | undefined): string {
  const codigo = Object.keys(ERRORES_CITA).find((c) => mensaje?.includes(c));
  return codigo ? ERRORES_CITA[codigo] : "No se pudo guardar. Inténtalo de nuevo.";
}

/** Horas posibles dentro de una franja, cada 15 minutos: 15:00 … 17:45. */
export function horasDeFranja(inicio: number, fin: number): string[] {
  const horas: string[] = [];
  for (let m = inicio * 60; m < fin * 60; m += 15) {
    horas.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return horas;
}
