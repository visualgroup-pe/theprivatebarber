"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import type { CatalogoReserva } from "./useSolicitud";

// Alto aproximado del formulario: reserva su espacio mientras carga (sin saltos).
const ALTO = "mt-14 min-h-[1097px]";

const Formulario = dynamic(() => import("./FormularioEscritorio").then((m) => m.FormularioEscritorio), {
  ssr: false,
  loading: () => <div className={ALTO} aria-hidden="true" />,
});

const CONSULTA = "(min-width: 961px)";
const suscribir = (avisar: () => void) => {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
};

/**
 * El formulario de escritorio (React Hook Form + Zod) solo se descarga en
 * pantallas de escritorio y después del render inicial: en el celular se usa
 * el flujo de /reserva y ese código no hace falta.
 */
export function FormularioEscritorioDiferido({ catalogo }: { catalogo: CatalogoReserva }) {
  const esEscritorio = useSyncExternalStore(
    suscribir,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
  if (!esEscritorio) return <div className={ALTO} aria-hidden="true" />;
  return <Formulario catalogo={catalogo} />;
}
