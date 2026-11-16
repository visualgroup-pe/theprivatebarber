import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props<T extends ElementType> = {
  as?: T;
  /** aparecer: sube y aparece (.rv) · cortina: la foto se descubre (.clip) */
  efecto?: "aparecer" | "cortina";
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * Animación al hacer scroll. Usa `animation-timeline: view()` donde existe;
 * en Safari y Firefox, ObservadorRevelar aplica el respaldo con
 * IntersectionObserver. Con movimiento reducido no se anima.
 */
export function Revelar<T extends ElementType = "div">({
  as,
  efecto = "aparecer",
  className,
  children,
  ...resto
}: Props<T>) {
  const Etiqueta = (as ?? "div") as ElementType;
  return (
    <Etiqueta className={cn(efecto === "cortina" ? "cortina" : "revelar", className)} {...resto}>
      {children}
    </Etiqueta>
  );
}
