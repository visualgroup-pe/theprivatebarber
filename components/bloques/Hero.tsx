import { Boton } from "@/components/ui/Boton";
import { Enlace } from "@/components/ui/Enlace";
import { Foto } from "@/components/ui/Foto";
import { enlaceWhatsApp } from "@/lib/contacto";

/** Foto del hero: variante «Espacio» del lienzo (por defecto). */
const HERO = { src: "/img/espacio-silla.jpg", posicion: "center 60%" };

export function Hero() {
  return (
    <header id="inicio" className="pt-[clamp(40px,5vw,72px)] pb-[clamp(120px,12vw,190px)]">
      <div className="contenedor">
        <div className="entrada flex flex-wrap justify-between gap-3 pb-[22px] text-[13px] text-tabaco">
          <span className="etiqueta">Barbería privada a domicilio</span>
          <span className="etiqueta solo-escritorio">Lima · Lunes a sábado, 9:00–21:00</span>
        </div>
        <div className="regla h-px bg-obsidiana opacity-85" aria-hidden="true" />
        <h1 className="font-serif hero-h entrada retraso-1 mt-[clamp(28px,4vw,56px)]">
          Precisión
          <span className="l2">
            <em className="text-huaca">en privado.</em>
          </span>
        </h1>
        <div className="hero-grid mt-[clamp(40px,5vw,72px)]">
          <div className="entrada retraso-3 pb-2">
            <p className="m-0 max-w-[400px] text-[clamp(18px,1.45vw,21px)] leading-[1.55]">
              Corte, barba y asesoría de imagen en tu casa, tu oficina o tu hotel. Llegamos a la hora acordada,
              trabajamos sin prisa y nos vamos sin dejar rastro.
            </p>
            <div className="mt-10 flex flex-col items-start gap-3.5">
              <Boton href="#reserva">Reservar una cita</Boton>
              <Enlace href={enlaceWhatsApp(undefined, "#reserva")} className="text-tabaco">
                o escríbenos por WhatsApp
              </Enlace>
            </div>
          </div>
          <figure className="hero-fig m-0">
            <Foto
              src={HERO.src}
              posicion={HERO.posicion}
              alt="Un sillón junto a ventanales con árboles, en luz de mañana"
              sizes="(min-width: 961px) 62vw, 100vw"
              aspecto="16 / 10"
              className="hero-cortina"
              preload
            />
            <Foto
              src="/img/corte-ventana.jpg"
              alt="Barbero cortando el cabello con tijera y peine junto a una ventana"
              sizes="(min-width: 961px) 23vw, 1px"
              className="hero-inset inserto-cortina"
            />
            <figcaption className="mt-[18px] flex justify-end gap-6 text-[13px] text-tabaco">
              <em className="font-serif text-[20px] text-obsidiana">Un sillón, una ventana, una hora tuya.</em>
            </figcaption>
          </figure>
        </div>
      </div>
    </header>
  );
}
