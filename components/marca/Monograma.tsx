import Image from "next/image";

type Props = {
  /** Color del fondo sobre el que va el monograma. */
  fondo?: "claro" | "oscuro";
  ancho?: number;
  /** Decorativo por defecto (alt=""). */
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function Monograma({ fondo = "oscuro", ancho = 54, alt = "", className, style }: Props) {
  const alto = Math.round((92 / 111.4) * ancho);
  return (
    <Image
      src={`/marca/monograma-fondo-${fondo}.svg`}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      width={ancho}
      height={alto}
      unoptimized
      className={className}
      style={{ width: ancho, height: "auto", ...style }}
    />
  );
}
