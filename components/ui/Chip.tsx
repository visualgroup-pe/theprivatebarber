import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<"input">, "type" | "children"> & {
  /** radio (opción única) o checkbox (casilla) reales */
  tipo?: "radio" | "checkbox";
  /** Fondo sobre el que va: oscuro (portada) o claro (pantallas móviles) */
  tono?: "oscuro" | "claro";
  children: ReactNode;
  className?: string;
  caraClassName?: string;
  caraStyle?: React.CSSProperties;
};

/**
 * Radio o casilla real con apariencia de opción táctil (44 px).
 * Sobre oscuro, marcado = fondo Lino; sobre claro, marcado = Obsidiana.
 */
export function Chip({
  tipo = "radio",
  tono = "oscuro",
  children,
  className,
  caraClassName,
  caraStyle,
  ...input
}: Props) {
  return (
    <label className={cn("chip", tono === "claro" && "chip--claro", className)}>
      <input type={tipo} {...input} />
      <span className={cn("chip__cara", caraClassName)} style={caraStyle}>
        {children}
      </span>
    </label>
  );
}
