import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Comun = {
  /** oscura: Obsidiana sobre claro · clara: Lino sobre oscuro */
  variante?: "oscura" | "clara";
  /** 44 px de alto */
  pequena?: boolean;
  /** Flecha que avanza 7 px al pasar el cursor */
  flecha?: boolean;
  className?: string;
  children: ReactNode;
};

type ComoEnlace = Comun & Omit<ComponentProps<typeof Link>, keyof Comun> & { href: string };
type ComoBoton = Comun & Omit<ComponentProps<"button">, keyof Comun> & { href?: undefined };

/**
 * Botón de marca (.cta del lienzo): relleno Huaca que sube desde abajo en 0.7 s.
 * Con `href` se renderiza como enlace; sin él, como <button>.
 */
export function Boton(props: ComoEnlace | ComoBoton) {
  const { variante = "oscura", pequena = false, flecha = true, className, children, ...resto } = props;
  const clases = cn(
    "boton",
    variante === "clara" && "boton--clara",
    pequena && "boton--pequena",
    className,
  );
  const contenido = (
    <>
      {children}
      {flecha && (
        <span className="flecha" aria-hidden="true">
          →
        </span>
      )}
    </>
  );

  if (typeof resto.href === "string") {
    return (
      <Link {...(resto as Omit<ComoEnlace, keyof Comun>)} className={clases}>
        {contenido}
      </Link>
    );
  }
  const { type = "button", ...botonProps } = resto as Omit<ComoBoton, keyof Comun>;
  return (
    <button type={type} {...botonProps} className={clases}>
      {contenido}
    </button>
  );
}
