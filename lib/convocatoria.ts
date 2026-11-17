import { ANOS_MINIMOS, FOTOS_MINIMAS, requisitos, type RequisitoId } from "@/content/convocatoria";

/** Lo que la evaluación necesita de una postulación (formulario o fila de la base). */
export type DatosEvaluacion = {
  anosOficio: number;
  tecnicas: string[];
  fotos: number;
  instagram?: string | null;
  herramientasPropias: boolean;
  compromisoHigiene: boolean;
  compromisoPuntualidad: boolean;
  zonas: string[];
};

/**
 * Compara una postulación con los requisitos publicados en /convocatoria.
 * No impide postular: marca a quien cumple para que la administración lo vea
 * primero, y dice qué le falta a quien no.
 */
export function evaluarPostulacion(d: DatosEvaluacion): {
  cumple: boolean;
  faltan: RequisitoId[];
} {
  const cumple: Record<RequisitoId, boolean> = {
    oficio: d.anosOficio >= ANOS_MINIMOS,
    tecnica: ["tijera", "maquina", "navaja"].every((t) => d.tecnicas.includes(t)),
    trabajos: d.fotos >= FOTOS_MINIMAS || Boolean(d.instagram?.trim()),
    maletin: d.herramientasPropias,
    higiene: d.compromisoHigiene,
    trato: d.compromisoPuntualidad,
    zonas: d.zonas.length > 0,
  };
  const faltan = requisitos.map((r) => r.id).filter((id) => !cumple[id]);
  return { cumple: faltan.length === 0, faltan };
}

export const nombreRequisito = (id: string) => requisitos.find((r) => r.id === id)?.titulo ?? id;

/** «@usuario», «instagram.com/usuario» o una URL → URL de Instagram (o la URL tal cual). */
export function enlaceInstagram(valor: string): string {
  const v = valor.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const usuario = v
    .replace(/^@/, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/\/$/, "");
  return `https://www.instagram.com/${encodeURIComponent(usuario)}/`;
}

export const BUCKET_POSTULACIONES = "postulaciones";
