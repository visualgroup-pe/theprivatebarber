import { Monograma } from "@/components/marca/Monograma";
import { Foto } from "@/components/ui/Foto";

export function Manifiesto() {
  return (
    <section
      aria-label="Nuestra idea"
      className="bg-obsidiana pt-[clamp(110px,13vw,200px)] pb-[clamp(80px,9vw,140px)] text-lino"
    >
      <div className="contenedor">
        <div className="mx-auto max-w-[1180px] text-center">
          <Monograma fondo="oscuro" ancho={54} className="revelar mx-auto mb-14 block" />
          <p className="font-serif revelar m-0 text-[clamp(34px,4.3vw,66px)] leading-[1.12] tracking-[-0.015em]">
            No tenemos local. Tenemos algo mejor: <em className="text-huaca-claro">tu espacio.</em> Llevamos la barbería
            completa hasta tu puerta y dejamos afuera el ruido, la espera y el sillón compartido.
          </p>
          <p className="etiqueta revelar mt-14 mb-0 text-garua">Tu imagen · Tu espacio · Tu tiempo</p>
        </div>
        <div className="duo mt-[clamp(90px,11vw,170px)]">
          <figure className="m-0">
            <Foto
              src="/img/detalle-navaja.jpg"
              alt="Perfilado con navaja en la nuca de un cliente"
              sizes="(min-width: 961px) 56vw, 100vw"
              aspecto="3 / 2"
              cortina
            />
            <figcaption className="mt-4 flex gap-[18px] text-[14px] text-garua">
              <span className="font-mono text-huaca-claro">01</span>El perfilado, a navaja y a pulso.
            </figcaption>
          </figure>
          <figure className="b m-0">
            <Foto
              src="/img/herramientas.jpg"
              alt="Navajas, brocha y peines ordenados sobre un paño oscuro"
              sizes="(min-width: 961px) 40vw, 100vw"
              aspecto="4 / 5"
              posicion="30% center"
              cortina
            />
            <figcaption className="mt-4 flex gap-[18px] text-[14px] text-garua">
              <span className="font-mono text-huaca-claro">02</span>Herramientas desinfectadas antes de cada visita.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
