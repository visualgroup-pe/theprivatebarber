import { FormularioEscritorio } from "@/components/reserva/FormularioEscritorio";
import { Boton } from "@/components/ui/Boton";
import { Enlace } from "@/components/ui/Enlace";
import { Foto } from "@/components/ui/Foto";
import { obtenerBarberos, obtenerServicios, obtenerZonas } from "@/lib/catalogo";
import { enlaceWhatsApp } from "@/lib/contacto";

/**
 * Bloque de reserva. En escritorio, el formulario del lienzo (con barbero,
 * lugar, dirección y consentimientos). En móvil, el acceso al flujo de tres
 * pasos de /reserva (pantallas móviles del lienzo).
 */
export async function Reserva() {
  const [servicios, zonas, barberos] = await Promise.all([obtenerServicios(), obtenerZonas(), obtenerBarberos()]);
  return (
    <section id="reserva" aria-labelledby="res-t" className="book bg-obsidiana text-lino">
      <Foto
        src="/img/barba.jpg"
        alt="Arreglo de barba con tijera y peine"
        sizes="42vw"
        posicion="38% center"
        className="solo-escritorio min-h-full"
      />
      <div className="px-[clamp(20px,6vw,110px)] py-[clamp(80px,9vw,150px)]">
        <h2 id="res-t" className="font-serif revelar m-0 text-[clamp(52px,6vw,100px)] leading-[0.9] tracking-[-0.03em]">
          Tu próxima cita,
          <br />
          <em className="text-huaca-claro">donde estés.</em>
        </h2>
        <p className="revelar mt-[26px] mb-0 max-w-[460px] text-[17px] leading-[1.6] text-garua">
          Envía tu solicitud. Te escribimos por WhatsApp cuando el barbero la confirme.
        </p>
        <div className="solo-escritorio">
          <FormularioEscritorio catalogo={{ servicios, zonas, barberos }} />
        </div>
        <div className="solo-movil revelar mt-12 flex flex-col items-start gap-3.5">
          <Boton href="/reserva" variante="clara" className="min-h-16 w-full">
            Reservar una cita
          </Boton>
          <Enlace href={enlaceWhatsApp(undefined, "/reserva")} className="text-garua">
            o escríbenos por WhatsApp
          </Enlace>
        </div>
      </div>
    </section>
  );
}
