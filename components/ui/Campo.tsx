import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Envoltura = {
  etiqueta: ReactNode;
  /** Mensaje de error en texto (no solo color). */
  error?: string;
  /** Texto de ayuda bajo el control. */
  ayuda?: ReactNode;
  /** Fondo: oscuro (portada) o claro (pantallas móviles) */
  tono?: "oscuro" | "claro";
  className?: string;
  /** Clase de la etiqueta (por defecto, versalitas). */
  etiquetaClassName?: string;
};

function idDe(id: string | undefined, name: string | undefined) {
  return id ?? (name ? `campo-${name}` : undefined);
}

function Marco({
  id,
  etiqueta,
  error,
  ayuda,
  tono = "oscuro",
  className,
  etiquetaClassName,
  children,
}: Envoltura & { id?: string; children: ReactNode }) {
  return (
    <div className={cn("campo", tono === "claro" && "campo--claro", className)}>
      <label htmlFor={id} className={cn("campo__etiqueta", etiquetaClassName ?? (tono === "claro" ? "etiqueta-sm" : "etiqueta"))}>
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && (
        <p id={id ? `${id}-ayuda` : undefined} className="m-0 text-[13px] leading-snug opacity-80">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={id ? `${id}-error` : undefined} className="campo__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string | undefined, error?: string, ayuda?: ReactNode) {
  if (!id) return undefined;
  if (error) return `${id}-error`;
  if (ayuda) return `${id}-ayuda`;
  return undefined;
}

type CampoProps = Envoltura & Omit<ComponentProps<"input">, "className">;

/** Campo de texto con solo línea inferior; al enfocarse cambia a Huaca claro. */
export function Campo({ etiqueta, error, ayuda, tono, className, etiquetaClassName, id, ...input }: CampoProps) {
  const campoId = idDe(id, input.name);
  return (
    <Marco {...{ etiqueta, error, ayuda, tono, className, etiquetaClassName }} id={campoId}>
      <input
        id={campoId}
        className="campo__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(campoId, error, ayuda)}
        {...input}
      />
    </Marco>
  );
}

type TextoProps = Envoltura & Omit<ComponentProps<"textarea">, "className">;

/** Texto largo (detalle de un reclamo, referencias) con la apariencia de Campo. */
export function CampoTexto({ etiqueta, error, ayuda, tono, className, etiquetaClassName, id, ...textarea }: TextoProps) {
  const campoId = idDe(id, textarea.name);
  return (
    <Marco {...{ etiqueta, error, ayuda, tono, className, etiquetaClassName }} id={campoId}>
      <textarea
        id={campoId}
        className="campo__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(campoId, error, ayuda)}
        rows={4}
        {...textarea}
      />
    </Marco>
  );
}

type SeleccionProps = Envoltura & Omit<ComponentProps<"select">, "className">;

/** Lista desplegable con la misma apariencia que Campo. */
export function CampoSeleccion({
  etiqueta,
  error,
  ayuda,
  tono,
  className,
  etiquetaClassName,
  id,
  children,
  ...select
}: SeleccionProps) {
  const campoId = idDe(id, select.name);
  return (
    <Marco {...{ etiqueta, error, ayuda, tono, className, etiquetaClassName }} id={campoId}>
      <select
        id={campoId}
        className="campo__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(campoId, error, ayuda)}
        {...select}
      >
        {children}
      </select>
    </Marco>
  );
}
