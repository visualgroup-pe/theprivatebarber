import type { Metadata } from "next";
import { PaginaLegal } from "@/components/bloques/PaginaLegal";
import { ofrecemos, proceso, requisitos, valoramos } from "@/content/convocatoria";
import { obtenerZonas } from "@/lib/catalogo";
import { openGraphDe } from "@/lib/sitio";
import { FormularioPostulacion } from "./FormularioPostulacion";

export const metadata: Metadata = {
  alternates: { canonical: "/convocatoria" },
  openGraph: openGraphDe("/convocatoria"),
  title: "Convocatoria de barberos",
  description:
    "Buscamos barberos con oficio para atender a domicilio en Lima: casas, oficinas y hoteles. Requisitos y postulación en línea.",
};

function Lateral() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="etiqueta mt-0 mb-4 text-huaca-profundo">Requisitos</p>
        <ol className="m-0 flex list-none flex-col border-t border-obsidiana p-0">
          {requisitos.map((r, i) => (
            <li key={r.id} className="flex gap-3 border-b border-obsidiana/15 py-3.5">
              <span className="font-mono w-6 shrink-0 text-[12px] leading-[22px] text-huaca-profundo">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{r.titulo}</span>
                <span className="text-[14px] leading-[1.5] text-tabaco">{r.texto}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="etiqueta mt-0 mb-3 text-huaca-profundo">Valoramos</p>
        <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[14px] leading-[1.5] text-tabaco">
          {valoramos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="etiqueta mt-0 mb-3 text-huaca-profundo">Lo que ofrecemos</p>
        <p className="m-0 text-[14px] leading-[1.5] text-tabaco">{ofrecemos}</p>
      </div>
    </div>
  );
}

function Proceso() {
  return (
    <section aria-labelledby="proceso-t" className="mb-20">
      <h2 id="proceso-t" className="font-serif mt-0 mb-8 text-[clamp(32px,3vw,44px)] leading-none">
        Cómo es el proceso
      </h2>
      <ol className="m-0 grid list-none grid-cols-1 gap-px bg-obsidiana/15 p-0 sm:grid-cols-2">
        {proceso.map((p, i) => (
          <li key={p.titulo} className="bg-lino py-5 pr-6">
            <p className="font-serif m-0 text-[20px] text-huaca-hondo">{["i.", "ii.", "iii.", "iv."][i]}</p>
            <p className="m-0 mt-1 text-[17px] font-semibold">{p.titulo}</p>
            <p className="m-0 mt-1.5 text-[15px] leading-[1.55] text-tabaco">{p.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function PaginaConvocatoria() {
  const zonas = (await obtenerZonas()).map((z) => z.distrito);
  return (
    <PaginaLegal
      etiqueta="Convocatoria"
      etiquetaDerecha="Barberos · Lima"
      titulo={
        <>
          Buscamos
          <br />
          <em className="text-huaca">barberos.</em>
        </>
      }
      entradilla={
        <p className="m-0">
          Atendemos en casas, oficinas y hoteles de Lima, con tiempo para cada detalle. Buscamos barberos con oficio,
          trato cuidadoso y orgullo por su trabajo.
        </p>
      }
      lateral={<Lateral />}
    >
      <Proceso />
      <FormularioPostulacion zonas={zonas} />
    </PaginaLegal>
  );
}
