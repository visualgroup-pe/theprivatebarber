/**
 * Tokens de marca para usar desde TypeScript (correos, OG, gráficos).
 * Deben coincidir con @theme en app/globals.css.
 */
export const colores = {
  obsidiana: "#161B18",
  tabaco: "#5A4636",
  huaca: "#A0634A",
  huacaProfundo: "#8E5640",
  huacaClaro: "#C98A6E",
  lino: "#EEE9E1",
  piedra: "#D8D1C5",
  garua: "#C9CCC7",
} as const;

export const curvas = {
  marca: "cubic-bezier(.16,1,.3,1)",
  cortina: "cubic-bezier(.65,0,.35,1)",
} as const;

export const ZONA_HORARIA = "America/Lima";
export const MONEDA = "PEN";

/** Soles sin decimales: «S/ 200». */
export function soles(monto: number): string {
  return `S/ ${Math.round(monto).toLocaleString("es-PE")}`;
}
