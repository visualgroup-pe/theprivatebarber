import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  /** Descriptivo; "" si es decorativa */
  alt: string;
  /** Ancho real en pantalla para elegir el tamaño (next/image) */
  sizes: string;
  /** p. ej. "3 / 4". Sin él, el marco toma el alto de su contenedor. */
  aspecto?: string;
  /** object-position */
  posicion?: string;
  /** Cortina al hacer scroll (.clip del lienzo) */
  cortina?: boolean;
  /** Solo la foto del hero */
  preload?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * Marco de foto (.fr del lienzo): recorte con object-fit cover y un
 * acercamiento lento al pasar el cursor. AVIF/WebP vía next/image.
 */
export function Foto({ src, alt, sizes, aspecto, posicion, cortina, preload, className, style, children }: Props) {
  return (
    <div className={cn("marco", cortina && "cortina", className)} style={{ aspectRatio: aspecto, ...style }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        style={posicion ? { objectPosition: posicion } : undefined}
      />
      {children}
    </div>
  );
}
