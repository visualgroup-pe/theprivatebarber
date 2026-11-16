import Image from "next/image";

type Variante = "horizontal" | "principal";
type Fondo = "claro" | "oscuro";

const ARCHIVOS: Record<Variante, Partial<Record<Fondo, { src: string; w: number; h: number }>>> = {
  horizontal: {
    claro: { src: "/marca/logo-horizontal-fondo-claro.svg", w: 744, h: 72 },
    oscuro: { src: "/marca/logo-horizontal-fondo-oscuro.svg", w: 744, h: 72 },
  },
  principal: {
    oscuro: { src: "/marca/logo-principal-fondo-oscuro.svg", w: 324, h: 130 },
  },
};

type Props = {
  variante?: Variante;
  /** Color del fondo sobre el que va el logo. */
  fondo?: Fondo;
  /** Alto en px (el ancho sale de la proporción). */
  alto?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function Logo({
  variante = "horizontal",
  fondo = "claro",
  alto = 28,
  alt = "The Private Barber",
  className,
  style,
}: Props) {
  const archivo = ARCHIVOS[variante][fondo] ?? ARCHIVOS[variante].oscuro!;
  const ancho = Math.round((archivo.w / archivo.h) * alto);
  return (
    <Image
      src={archivo.src}
      alt={alt}
      width={ancho}
      height={alto}
      unoptimized
      className={className}
      style={{ height: alto, width: "auto", ...style }}
    />
  );
}
