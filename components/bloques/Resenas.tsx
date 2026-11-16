import { Enlace } from "@/components/ui/Enlace";
import { resenas } from "@/content/resenas";

export function Resenas() {
  return (
    <section
      id="resenas"
      aria-labelledby="test-t"
      className="pt-[clamp(100px,11vw,170px)] pb-[clamp(140px,14vw,220px)]"
    >
      <div className="contenedor">
        <div className="mb-[clamp(56px,7vw,96px)] flex flex-wrap items-end justify-between gap-6">
          <h2 id="test-t" className="font-serif revelar m-0 text-[clamp(52px,6.6vw,112px)] leading-[0.92] tracking-[-0.03em]">
            Lo dicen ellos.
          </h2>
          <div className="revelar flex flex-col items-start gap-1">
            <span className="text-[14px] text-tabaco">Reseñas de Google Maps, tal como las escribieron.</span>
            <Enlace href="/resenas" flecha className="text-obsidiana">
              Ver todas las reseñas
            </Enlace>
          </div>
        </div>
        <div className="revs">
          {resenas.map((r) => (
            <figure key={r.autor} className="revelar m-0 border-t border-obsidiana pt-[22px]">
              <span aria-hidden="true" className="font-serif block text-[120px] leading-[0.7] text-huaca">
                “
              </span>
              <blockquote className="mt-2 mb-0">
                <p className="font-serif m-0 text-[clamp(30px,2.6vw,40px)] leading-[1.1]">{r.texto}</p>
              </blockquote>
              <figcaption className="mt-[26px] text-[14px]">
                <strong className="font-semibold">{r.autor}</strong>
                <span className="text-tabaco"> · Google · {r.hace}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
