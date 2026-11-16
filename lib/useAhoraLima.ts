"use client";

import { useSyncExternalStore } from "react";
import { ahoraEnLima } from "./disponibilidad";

// Una instantánea por minuto: un texto estable para useSyncExternalStore.
const instantanea = () => {
  const { fecha, minutos } = ahoraEnLima();
  return `${fecha}|${minutos}`;
};
const suscribir = (avisar: () => void) => {
  const id = setInterval(avisar, 60_000);
  return () => clearInterval(id);
};

/**
 * Fecha y minuto actuales en Lima, solo en el navegador. Durante el
 * prerender devuelve null (Cache Components no permite leer la hora ahí):
 * el formulario se pinta igual y, al hidratarse, marca días y franjas.
 */
export function useAhoraLima(): { fecha: string; minutos: number } | null {
  const valor = useSyncExternalStore(suscribir, instantanea, () => null);
  if (!valor) return null;
  const [fecha, minutos] = valor.split("|");
  return { fecha, minutos: Number(minutos) };
}
