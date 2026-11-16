"use client";

import { useActionState, type ReactNode } from "react";
import { Boton } from "@/components/ui/Boton";
import type { ResultadoAccion } from "@/lib/acciones/citas";
import { cn } from "@/lib/cn";

type Accion = (previo: ResultadoAccion, fd: FormData) => Promise<ResultadoAccion>;

/** Formulario del panel que llama a una acción del servidor y muestra el resultado en texto. */
export function FormAccion({
  accion,
  boton,
  children,
  className,
  variante = "oscura",
  etiqueta,
}: {
  accion: Accion;
  boton: string;
  children?: ReactNode;
  className?: string;
  variante?: "oscura" | "clara";
  etiqueta?: string;
}) {
  const [r, act, enviando] = useActionState<ResultadoAccion, FormData>(accion, null);
  return (
    <form action={act} aria-label={etiqueta} className={cn("flex flex-col gap-5", className)}>
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <Boton type="submit" pequena variante={variante} disabled={enviando}>
          {enviando ? "Guardando…" : boton}
        </Boton>
        {r && (
          <p role={r.ok ? "status" : "alert"} className={cn("m-0 text-[14px]", r.ok ? "text-tabaco" : "text-huaca-profundo")}>
            {r.mensaje}
          </p>
        )}
      </div>
    </form>
  );
}
