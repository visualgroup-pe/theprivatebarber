import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  /** Flecha que avanza 7 px al pasar el cursor */
  flecha?: boolean;
};

/**
 * Enlace de texto (.ln del lienzo): versalitas con subrayado que se
 * recoge hacia la derecha al pasar el cursor. 44 px de alto mínimo.
 */
export function Enlace({ children, flecha = false, className, ...resto }: Props) {
  return (
    <Link {...resto} className={cn("enlace", className)}>
      <span className="enlace__texto">{children}</span>
      {flecha && (
        <>
          {" "}
          <span className="flecha" aria-hidden="true">
            →
          </span>
        </>
      )}
    </Link>
  );
}

/**
 * Enlace de navegación (.nl del lienzo): una línea Huaca crece
 * de izquierda a derecha al pasar el cursor.
 */
export function EnlaceNav({ className, ...resto }: ComponentProps<typeof Link>) {
  return <Link {...resto} className={cn("enlace-nav", className)} />;
}
