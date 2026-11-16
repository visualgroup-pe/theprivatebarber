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
  /** Sobre el pliegue (nav): carga inmediata */
  eager?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Logo({
  variante = "horizontal",
  fondo = "claro",
  alto = 28,
  alt = "The Private Barber",
  eager,
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
      loading={eager ? "eager" : undefined}
      className={className}
      // Ancho fijo y alto proporcional: si no cabe (nav a 390 px), se reduce sin deformarse.
      style={{ width: ancho, height: "auto", maxWidth: "100%", ...style }}
    />
  );
}
