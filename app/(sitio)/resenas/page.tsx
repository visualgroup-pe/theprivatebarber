import type { Metadata } from "next";
import { NavFija } from "@/components/bloques/NavFija";
import { Pie } from "@/components/bloques/Pie";
import { Boton } from "@/components/ui/Boton";
import { Enlace } from "@/components/ui/Enlace";
import { Foto } from "@/components/ui/Foto";
import { perfilGoogle, resenas } from "@/content/resenas";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Reseñas",
  description:
    "Reseñas de clientes de The Private Barber en Google Maps, copiadas tal como las escribieron: sin editar y sin elegir solo las mejores frases.",
};

/** Página de reseñas: referencia/diseno/Resenas.dc.html */
export default function PaginaResenas() {
  return (
    <div className="pagina">
      <NavFija enPortada={false} actual="resenas" />
      <main>
        <header className="pt-[clamp(80px,10vw,160px)] pb-[clamp(40px,5vw,72px)]">
          <div className="contenedor">
            <div className="entrada flex flex-wrap justify-between gap-3 pb-[22px] text-tabaco">
              <span className="etiqueta">Reseñas de clientes</span>
              <span className="etiqueta">
                {perfilGoogle.calificacion} en Google · {perfilGoogle.total} reseñas
              </span>
            </div>
            <div className="regla h-px bg-obsidiana opacity-85" aria-hidden="true" />
            <h1 className="font-serif hero-h entrada retraso-1 mt-[clamp(28px,4vw,56px)]">
              Lo dicen
              <span className="l2">
                <em className="text-huaca">ellos.</em>
              </span>
            </h1>
            <p className="entrada retraso-3 mt-[clamp(40px,5vw,72px)] mr-0 mb-0 ml-auto max-w-[440px] text-[18px] leading-[1.6] text-tabaco">
              Cada reseña viene de Google Maps y está copiada tal como la escribió el cliente: sin editar y sin elegir solo
              las mejores frases.
            </p>
          </div>
        </header>

        <section aria-label="Reseñas" className="pb-[clamp(90px,10vw,150px)]">
          <div className="contenedor">
            {resenas.map((r, i) => (
              <figure
                key={r.autor}
                className={cn(
                  "revelar m-0 max-w-[1000px] border-b border-piedra py-[clamp(56px,7vw,110px)]",
                  i % 2 === 1 && "ml-auto text-right",
                )}
              >
                <span aria-hidden="true" className="font-serif block text-[160px] leading-[0.6] text-huaca">
                  “
                </span>
                <blockquote className="mt-5 mb-0">
                  <p className="font-serif m-0 text-[clamp(44px,5.6vw,92px)] leading-none tracking-[-0.025em]">
                    {r.texto}
                  </p>
                </blockquote>
                <figcaption className="mt-[34px] text-[15px]">
                  <strong className="font-semibold">{r.autor}</strong>
                  <span className="text-tabaco">
                    {" "}
                    · {r.perfil} · Google Maps, {r.hace}
                  </span>
                </figcaption>
              </figure>
            ))}
            <div className="revelar mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <p className="m-0 text-[16px] text-tabaco">¿Ya te atendimos? Tu opinión ayuda a otros a decidir.</p>
              <Enlace href={perfilGoogle.enlace} flecha className="text-obsidiana">
                Escribir una reseña en Google
              </Enlace>
            </div>
          </div>
        </section>

        <section aria-labelledby="cta-t" className="book bg-obsidiana text-lino">
          <Foto
            src="/img/corte-ventana.jpg"
            alt="Corte con tijera junto a una ventana"
            sizes="42vw"
            // En el lienzo la foto está en el flujo: su proporción (2:3) fija el alto del bloque.
            aspecto="1333 / 2000"
            className="solo-escritorio min-h-[560px] self-start"
          />
          <div className="flex flex-col items-start justify-center px-[clamp(20px,6vw,110px)] py-[clamp(80px,9vw,140px)]">
            <h2 id="cta-t" className="font-serif revelar m-0 text-[clamp(52px,6vw,100px)] leading-[0.9] tracking-[-0.03em]">
              La próxima reseña
              <br />
              <em className="text-huaca-claro">puede ser la tuya.</em>
            </h2>
            <Boton href="/#reserva" variante="clara" className="revelar mt-12 min-h-16">
              Reservar una cita
            </Boton>
          </div>
        </section>
      </main>
      <Pie enPortada={false} />
    </div>
  );
}
