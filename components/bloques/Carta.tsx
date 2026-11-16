import { Boton } from "@/components/ui/Boton";
import { Foto } from "@/components/ui/Foto";
import { obtenerServicios } from "@/lib/catalogo";
import { soles } from "@/lib/tokens";

export async function Carta() {
  const servicios = await obtenerServicios();
  return (
    <section id="servicios" aria-labelledby="serv-t" className="py-[clamp(110px,12vw,190px)]">
      <div className="contenedor split">
        <figure className="solo-escritorio sticky top-[110px] m-0">
          <Foto
            src="/img/ejecutivo-reflejo.jpg"
            alt="Hombre de traje reflejado en una ventana"
            sizes="40vw"
            aspecto="3 / 4.2"
            cortina
          />
          <figcaption className="mt-4">
            <em className="font-serif text-[20px]">Para el que no tiene una hora libre en la semana.</em>
          </figcaption>
        </figure>
        <div>
          <p className="etiqueta revelar mt-0 mb-6 text-huaca-profundo">Servicios</p>
          <h2 id="serv-t" className="font-serif revelar m-0 text-[clamp(64px,8vw,140px)] leading-[0.86] tracking-[-0.035em]">
            La carta
          </h2>
          <p className="revelar mt-7 mb-0 max-w-[460px] text-[16px] leading-[1.6] text-tabaco">
            Precios en soles. Cada servicio dura entre 45 minutos y una hora, e incluye traslado dentro de las zonas de
            atención y la limpieza del espacio al terminar.
          </p>
          <div className="mt-14 border-t border-obsidiana">
            {servicios.map((s) => (
              <div key={s.slug} className="mitem revelar">
                <div className="mrow">
                  <h3 className="font-serif m-0 text-[clamp(30px,2.6vw,40px)] leading-none">{s.nombre}</h3>
                  <span className="dots" aria-hidden="true" />
                  <span className="font-mono text-[17px]">{soles(s.precioPen)}</span>
                </div>
                <p className="mt-2.5 mb-0 flex justify-between gap-5 text-[15px] text-tabaco">
                  <em>{s.descripcion}</em>
                  <span className="font-mono text-[12px] whitespace-nowrap">{s.duracionTexto}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="revelar mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Boton href="#reserva">Elegir servicio y horario</Boton>
            <span className="text-[14px] text-tabaco">Tarjeta · Yape · Plin · Transferencia · Efectivo</span>
          </div>
        </div>
      </div>
    </section>
  );
}
