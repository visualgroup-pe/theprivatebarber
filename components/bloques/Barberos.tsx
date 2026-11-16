import { Monograma } from "@/components/marca/Monograma";
import { Boton } from "@/components/ui/Boton";
import { Enlace } from "@/components/ui/Enlace";
import { Foto } from "@/components/ui/Foto";

/*
 * Datos del lienzo. Pendientes (BRIEF): nombre, foto y especialidad del
 * segundo barbero; especialidad de Nilber; foto real de Nilber.
 */
export function Barberos() {
  return (
    <section
      id="barberos"
      aria-labelledby="barb-t"
      className="bg-tabaco py-[clamp(100px,11vw,170px)] text-lino"
    >
      <div className="contenedor barb">
        <div>
          <Foto
            src="/img/nilber.jpg"
            alt="Retrato de Nilber, barbero de The Private Barber"
            sizes="(min-width: 961px) 55vw, 100vw"
            aspecto="4 / 4.6"
            posicion="center 12%"
            className="bg-piedra"
            cortina
          />
          <h3 className="font-serif bname revelar">Nilber</h3>
        </div>
        <div className="pb-3">
          <p className="etiqueta revelar mt-0 mb-6 text-huaca-claro">Los barberos</p>
          <h2 id="barb-t" className="font-serif revelar m-0 text-[clamp(44px,4.6vw,76px)] leading-[0.96] tracking-[-0.025em]">
            Pocos,
            <br />
            <em>a propósito.</em>
          </h2>
          <p className="revelar mt-[26px] mb-0 text-[17px] leading-[1.6] text-piedra">
            Así cada uno conoce a sus clientes por su nombre y por su corte.
          </p>
          <dl className="revelar mt-11 mb-0 border-t border-lino/25">
            {[
              ["Atiende", "Jueves"],
              ["Oficio", "5 años"],
              ["Especialidad", "[Por confirmar]"],
            ].map(([dt, dd]) => (
              <div key={dt} className="flex justify-between gap-4 border-b border-lino/25 py-[15px]">
                <dt className="text-piedra">{dt}</dt>
                <dd className="m-0">{dd}</dd>
              </div>
            ))}
          </dl>
          <Boton href="#reserva" variante="clara" className="mt-8">
            Reservar con Nilber
          </Boton>
        </div>
      </div>
      <div className="contenedor mt-[clamp(80px,9vw,140px)]">
        <div className="revelar grid grid-cols-[auto_1fr_auto] items-center gap-[clamp(24px,4vw,56px)] border-y border-lino/25 py-8">
          <div className="solo-escritorio flex aspect-square w-[120px] items-center justify-center bg-obsidiana">
            <Monograma fondo="oscuro" ancho={40} />
          </div>
          <div>
            <h3 className="font-serif m-0 text-[clamp(44px,5vw,80px)] leading-[0.9] tracking-[-0.03em]">[Nombre]</h3>
            <p className="mt-3 mb-0 text-[15px] text-piedra">
              Lunes a sábado, 9:00–21:00 · 5 años de oficio · Retrato en sesión de fotos
            </p>
          </div>
          <Enlace href="#reserva" flecha className="text-lino">
            Reservar
          </Enlace>
        </div>
      </div>
    </section>
  );
}
