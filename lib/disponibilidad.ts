/**
 * Disponibilidad: qué días y franjas ofrece el formulario según el horario
 * de cada barbero. Se usa igual en el navegador y en el servidor; la base de
 * datos vuelve a comprobarlo al crear la cita (barbero_atiende).
 * Fechas como texto «AAAA-MM-DD» en hora de Lima (UTC−5, sin horario de verano).
 */
import type { Barbero, Horario } from "@/content/barberos";
import { franjas, type FranjaId } from "@/content/zonas";

/** Hasta cuántos días adelante se puede pedir. */
export const DIAS_ADELANTE = 60;
/** Anticipación mínima antes del inicio de la franja. Pendiente del brief: [X horas]. */
export const ANTICIPACION_MINIMA_HORAS = 0;

const MS_DIA = 86_400_000;
const LIMA = "America/Lima";

/** Fecha y minutos del día actuales en Lima. */
export function ahoraEnLima(ahora: Date = new Date()): { fecha: string; minutos: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ahora);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? "00";
  return { fecha: `${p("year")}-${p("month")}-${p("day")}`, minutos: Number(p("hour")) * 60 + Number(p("minute")) };
}

const aUtc = (fecha: string) => {
  const [a, m, d] = fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};
const deUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function sumarDias(fecha: string, dias: number): string {
  return deUtc(aUtc(fecha) + dias * MS_DIA);
}

/** ISO 8601: 1 = lunes … 7 = domingo. */
export function diaIso(fecha: string): number {
  return new Date(aUtc(fecha)).getUTCDay() || 7;
}

export function lunesDe(fecha: string): string {
  return sumarDias(fecha, 1 - diaIso(fecha));
}

const minutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Franjas que el barbero cubre ese día (y que aún no empezaron, si es hoy). */
export function franjasDisponibles(
  barbero: Pick<Barbero, "horarios"> | undefined,
  fecha: string | undefined,
  ahora = ahoraEnLima(),
): FranjaId[] {
  if (!barbero || !fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return [];
  if (fecha < ahora.fecha || fecha > sumarDias(ahora.fecha, DIAS_ADELANTE)) return [];
  const delDia = barbero.horarios.filter((h) => h.diaSemana === diaIso(fecha));
  return franjas
    .filter((f) => delDia.some((h) => minutos(h.horaInicio) <= f.inicio * 60 && minutos(h.horaFin) >= f.fin * 60))
    .filter((f) => fecha > ahora.fecha || f.inicio * 60 > ahora.minutos + ANTICIPACION_MINIMA_HORAS * 60)
    .map((f) => f.id);
}

export function diaDisponible(barbero: Pick<Barbero, "horarios"> | undefined, fecha: string, ahora = ahoraEnLima()) {
  return franjasDisponibles(barbero, fecha, ahora).length > 0;
}

/** Primer día con alguna franja libre para el barbero. */
export function primerDiaDisponible(barbero: Pick<Barbero, "horarios"> | undefined, ahora = ahoraEnLima()) {
  for (let i = 0; i <= DIAS_ADELANTE; i++) {
    const fecha = sumarDias(ahora.fecha, i);
    if (diaDisponible(barbero, fecha, ahora)) return fecha;
  }
  return undefined;
}

// ── Textos ────────────────────────────────────────────────────────

const NOMBRES_DIA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const CORTOS_DIA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const hora = (h: string) => String(Number(h.slice(0, 2)));

/**
 * Días de atención: «Jueves» o «Lun a sáb · 9–21» (tarjetas del barbero) y
 * «atiende solo jueves» o «atiende de lunes a sábado» (nota del calendario).
 */
export function describirDias(horarios: Horario[]): { corto: string; nota: string } {
  const dias = [...new Set(horarios.map((h) => h.diaSemana))].sort((a, b) => a - b);
  if (dias.length === 0) return { corto: "Sin horario", nota: "no tiene horario por ahora" };
  if (dias.length === 1) {
    const nombre = NOMBRES_DIA[dias[0] - 1];
    return { corto: nombre[0].toUpperCase() + nombre.slice(1), nota: `atiende solo ${nombre}` };
  }
  const seguidos = dias.every((d, i) => i === 0 || d === dias[i - 1] + 1);
  const h0 = horarios[0];
  const horas = horarios.every((h) => h.horaInicio === h0.horaInicio && h.horaFin === h0.horaFin)
    ? ` · ${hora(h0.horaInicio)}–${hora(h0.horaFin)}`
    : "";
  if (seguidos) {
    const de = NOMBRES_DIA[dias[0] - 1];
    const a = NOMBRES_DIA[dias[dias.length - 1] - 1];
    return { corto: `${CORTOS_DIA[dias[0] - 1]} a ${a.slice(0, 3)}${horas}`, nota: `atiende de ${de} a ${a}` };
  }
  const lista = dias.map((d) => NOMBRES_DIA[d - 1]);
  const texto = `${lista.slice(0, -1).join(", ")} y ${lista[lista.length - 1]}`;
  return { corto: texto[0].toUpperCase() + texto.slice(1) + horas, nota: `atiende ${texto}` };
}

const fmt = (opciones: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", ...opciones });

/** «Jue 10 dic» */
export function fechaCorta(fecha: string): string {
  const d = new Date(aUtc(fecha));
  const mes = fmt({ month: "short" }).format(d).replace(".", "").toLowerCase();
  return `${CORTOS_DIA[diaIso(fecha) - 1]} ${d.getUTCDate()} ${mes}`;
}

/** «Jueves 10 de diciembre» */
export function fechaLarga(fecha: string): string {
  const texto = fmt({ weekday: "long", day: "numeric", month: "long" }).format(new Date(aUtc(fecha))).replace(",", "");
  return texto[0].toUpperCase() + texto.slice(1);
}

/** «Diciembre» o «Noviembre – Diciembre» para una semana. */
export function mesesDeSemana(lunes: string): string {
  const mes = (f: string) => {
    const t = fmt({ month: "long" }).format(new Date(aUtc(f)));
    return t[0].toUpperCase() + t.slice(1);
  };
  const a = mes(lunes);
  const b = mes(sumarDias(lunes, 6));
  return a === b ? a : `${a} – ${b}`;
}

export const ABREVIATURAS_DIA = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export function franjaTexto(id: FranjaId, conHoras = true): string {
  const f = franjas.find((x) => x.id === id)!;
  return conHoras ? `${f.nombre} · ${f.inicio}–${f.fin}` : f.nombre;
}
