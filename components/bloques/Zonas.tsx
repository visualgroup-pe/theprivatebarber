import { Fragment } from "react";

const DISTRITOS = ["San Isidro", "Miraflores", "Surco", "San Borja"];

export function Zonas() {
  return (
    <section aria-labelledby="zon-t" className="bg-obsidiana py-[clamp(100px,11vw,170px)] text-center text-lino">
      <div className="contenedor">
        <p id="zon-t" className="etiqueta revelar mt-0 mb-12 text-huaca-claro">
          Dónde atendemos
        </p>
        <p className="font-serif revelar mx-auto my-0 max-w-[1240px] text-[clamp(44px,6.4vw,108px)] leading-[1.02] tracking-[-0.025em]">
          {DISTRITOS.map((d) => (
            <Fragment key={d}>
              {d} <span className="text-huaca">·</span>{" "}
            </Fragment>
          ))}
          <em>La Molina</em>
        </p>
        <p className="revelar mx-auto mt-12 mb-0 max-w-[520px] text-[16px] leading-[1.6] text-garua">
          En casa, en la oficina o en el hotel. ¿Estás en otro distrito? Escríbenos y te confirmamos si podemos llegar.
        </p>
        <p className="font-mono revelar mt-7 mb-0 text-[13px] text-garua">LUN–SÁB · 09:00–21:00</p>
      </div>
    </section>
  );
}
