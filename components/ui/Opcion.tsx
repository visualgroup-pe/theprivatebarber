import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<"input">, "type" | "children"> & {
  tipo?: "radio" | "checkbox";
  /** Contenido de la tarjeta (título, descripción, precio…) */
  children: ReactNode;
  className?: string;
  tarjetaClassName?: string;
};

/**
 * Opción en tarjeta (.opt de las pantallas móviles de reserva): radio o
 * casilla real; marcada = fondo blanco, borde Obsidiana y filete Huaca.
 */
export function Opcion({ tipo = "radio", children, className, tarjetaClassName, ...input }: Props) {
  return (
    <label className={cn("opcion", className)}>
      <input type={tipo} {...input} />
      <span className={cn("opcion__tarjeta", tarjetaClassName)}>{children}</span>
    </label>
  );
}
