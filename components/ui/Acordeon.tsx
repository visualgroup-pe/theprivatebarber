import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  pregunta: ReactNode;
  children: ReactNode;
  abierto?: boolean;
  /** El último ítem lleva línea Obsidiana en lugar de la línea suave. */
  ultimo?: boolean;
  className?: string;
};

/**
 * details/summary nativo con el signo + que gira 45°.
 * Medidas del bloque Preguntas del lienzo.
 */
export function Acordeon({ pregunta, children, abierto, ultimo, className }: Props) {
  return (
    <details
      open={abierto}
      className={cn(
        "acordeon border-b",
        ultimo ? "border-obsidiana" : "border-obsidiana/20",
        className,
      )}
    >
      <summary className="font-serif flex min-h-11 items-center justify-between gap-6 py-7 text-[clamp(26px,2.2vw,34px)] leading-[1.1]">
        {pregunta}
        <span className="acordeon__signo text-[34px] text-huaca-profundo" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="mb-[30px] max-w-[640px] text-[17px] leading-[1.65] text-tabaco">{children}</div>
    </details>
  );
}
