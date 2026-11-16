import type { Metadata } from "next";
import { openGraphDe } from "@/lib/sitio";
import { PaginaLegal } from "@/components/bloques/PaginaLegal";
import { empresa } from "@/lib/empresa";
import { FormularioReclamacion } from "./FormularioReclamacion";

export const metadata: Metadata = {
  alternates: { canonical: "/libro-de-reclamaciones" },
  openGraph: openGraphDe("/libro-de-reclamaciones"),
  title: "Libro de Reclamaciones",
  description:
    "Libro de Reclamaciones virtual de The Private Barber, conforme al Código de Protección y Defensa del Consumidor.",
};

function DatosProveedor() {
  const fila = "flex flex-col gap-0.5 border-b border-obsidiana/15 py-3";
  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="etiqueta mt-0 mb-4 text-huaca-profundo">Proveedor</p>
        <dl className="m-0 border-t border-obsidiana text-[15px]">
          <div className={fila}>
            <dt className="text-tabaco">Razón social</dt>
            <dd className="m-0">{empresa.razonSocial}</dd>
          </div>
          <div className={fila}>
            <dt className="text-tabaco">RUC</dt>
            <dd className="font-mono m-0">{empresa.ruc}</dd>
          </div>
          <div className={fila}>
            <dt className="text-tabaco">Domicilio</dt>
            <dd className="m-0">{empresa.domicilio}</dd>
          </div>
          <div className={fila}>
            <dt className="text-tabaco">Hoja de reclamación N.°</dt>
            <dd className="m-0">Se asigna al enviar</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-col gap-3 text-[14px] leading-[1.55] text-tabaco">
        <p className="m-0">
          <strong className="font-semibold text-obsidiana">Reclamo:</strong> disconformidad relacionada con los productos o
          servicios.
        </p>
        <p className="m-0">
          <strong className="font-semibold text-obsidiana">Queja:</strong> disconformidad no relacionada con los productos
          o servicios, o malestar o descontento respecto a la atención al público.
        </p>
        <p className="m-0">
          La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo
          para interponer una denuncia ante el INDECOPI.
        </p>
        <p className="m-0">
          El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles.
        </p>
      </div>
    </div>
  );
}

export default function PaginaLibroDeReclamaciones() {
  return (
    <PaginaLegal
      etiqueta="Legal"
      etiquetaDerecha="Hoja de reclamación virtual"
      titulo={
        <>
          Libro de
          <br />
          <em className="text-huaca">Reclamaciones.</em>
        </>
      }
      entradilla={
        <p className="m-0">
          Conforme al Código de Protección y Defensa del Consumidor, tienes a tu disposición este Libro de Reclamaciones
          virtual. Completa la hoja y recibirás una copia en tu correo.
        </p>
      }
      lateral={<DatosProveedor />}
    >
      <FormularioReclamacion />
    </PaginaLegal>
  );
}
