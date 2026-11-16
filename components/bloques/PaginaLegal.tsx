import type { ReactNode } from "react";
import { NavFija } from "@/components/bloques/NavFija";
import { Pie } from "@/components/bloques/Pie";
import { EnlaceNav } from "@/components/ui/Enlace";

export type SeccionLegal = { id: string; titulo: string; contenido: ReactNode };

type Props = {
  /** Etiqueta izquierda del encabezado */
  etiqueta: string;
  /** Etiqueta derecha del encabezado */
  etiquetaDerecha?: ReactNode;
  titulo: ReactNode;
  entradilla?: ReactNode;
  secciones?: SeccionLegal[];
  /** Columna izquierda propia (en lugar del índice) */
  lateral?: ReactNode;
  /** Contenido propio (p. ej., el formulario del Libro de Reclamaciones) */
  children?: ReactNode;
};

/**
 * Plantilla de las páginas legales. Usa el lenguaje del lienzo:
 * encabezado de Reseñas (etiquetas, regla, titular serif) y la retícula
 * 4fr/8fr del bloque Preguntas, con índice fijo en escritorio.
 */
export function PaginaLegal({ etiqueta, etiquetaDerecha, titulo, entradilla, secciones, lateral, children }: Props) {
  return (
    <div className="pagina">
      <NavFija enPortada={false} />
      <main>
        <header className="pt-[clamp(80px,10vw,160px)] pb-[clamp(56px,7vw,96px)]">
          <div className="contenedor">
            <div className="entrada flex flex-wrap justify-between gap-3 pb-[22px] text-tabaco">
              <span className="etiqueta">{etiqueta}</span>
              {etiquetaDerecha && <span className="etiqueta">{etiquetaDerecha}</span>}
            </div>
            <div className="regla h-px bg-obsidiana opacity-85" aria-hidden="true" />
            <h1 className="font-serif entrada retraso-1 mt-[clamp(28px,4vw,56px)] mb-0 text-[clamp(52px,6.6vw,112px)] leading-[0.92] tracking-[-0.03em]">
              {titulo}
            </h1>
            {entradilla && (
              <div className="entrada retraso-3 mt-[clamp(32px,4vw,56px)] max-w-[560px] text-[18px] leading-[1.6] text-tabaco">
                {entradilla}
              </div>
            )}
          </div>
        </header>

        <div className="contenedor legal pb-[clamp(100px,11vw,170px)]">
          {lateral ? (
            <aside className="lg:sticky lg:top-[110px]">{lateral}</aside>
          ) : secciones && secciones.length > 0 ? (
            <nav aria-label="En esta página" className="indice lg:sticky lg:top-[110px]">
              <p className="etiqueta mt-0 mb-5 text-huaca-profundo">En esta página</p>
              <ol className="m-0 flex list-none flex-col gap-3 border-t border-obsidiana p-0 pt-5 text-[15px] text-tabaco">
                {secciones.map((s, i) => (
                  <li key={s.id} className="flex gap-3">
                    <span className="font-mono w-6 shrink-0 text-[12px] leading-[22px] text-huaca-profundo">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <EnlaceNav href={`#${s.id}`}>{s.titulo}</EnlaceNav>
                  </li>
                ))}
              </ol>
            </nav>
          ) : (
            <div aria-hidden="true" />
          )}
          <div>
            {secciones && (
              <div className="prosa">
                {secciones.map((s) => (
                  <section key={s.id} aria-labelledby={s.id}>
                    <h2 id={s.id}>{s.titulo}</h2>
                    {s.contenido}
                  </section>
                ))}
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
      <Pie enPortada={false} />
    </div>
  );
}
