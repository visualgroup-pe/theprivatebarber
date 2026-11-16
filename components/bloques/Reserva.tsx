import Link from "next/link";
import { Boton } from "@/components/ui/Boton";
import { Campo, CampoSeleccion } from "@/components/ui/Campo";
import { Chip } from "@/components/ui/Chip";
import { Foto } from "@/components/ui/Foto";
import { franjas, OTRO_DISTRITO } from "@/content/zonas";
import { obtenerServicios, obtenerZonas } from "@/lib/catalogo";
import { soles } from "@/lib/tokens";

/**
 * Bloque de reserva. Etapa 2: formulario estático, fiel al lienzo.
 * En la etapa 5 se conecta a /api/solicitudes con validación Zod.
 */
export async function Reserva() {
  const [servicios, zonas] = await Promise.all([obtenerServicios(), obtenerZonas()]);
  const serviciosPrincipales = servicios.filter((s) => !s.esAdicional);
  const asesoria = servicios.find((s) => s.esAdicional);
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
        <form aria-label="Solicitud de cita" className="revelar mt-14 flex flex-col gap-10">
          <fieldset className="m-0 border-0 p-0">
            <legend className="etiqueta mb-4 p-0 text-garua">Servicio</legend>
            <div className="flex flex-wrap gap-2.5">
              {serviciosPrincipales.map((s, i) => (
                <Chip key={s.id} name="servicio" value={s.id} defaultChecked={i === 0}>
                  {s.nombre}
                </Chip>
              ))}
            </div>
            {asesoria && (
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Chip tipo="checkbox" name="asesoria" value="si">
                  + {asesoria.nombre} · {soles(asesoria.precioPen)}
                </Chip>
              </div>
            )}
          </fieldset>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-7 gap-y-8">
            <CampoSeleccion etiqueta="Distrito" name="distrito" defaultValue={zonas[0]?.id}>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.distrito}
                </option>
              ))}
              <option>{OTRO_DISTRITO}</option>
            </CampoSeleccion>
            <Campo etiqueta="Fecha" name="fecha" type="date" />
          </div>
          <fieldset className="m-0 border-0 p-0">
            <legend className="etiqueta mb-4 p-0 text-garua">Hora preferida</legend>
            <div className="flex flex-wrap gap-2.5">
              {franjas.map((f, i) => (
                <Chip key={f.id} name="franja" value={f.id} defaultChecked={i === 0}>
                  {f.nombre} · {f.inicio}–{f.fin}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-7 gap-y-8">
            <Campo etiqueta="Nombre" name="nombre" placeholder="Tu nombre" autoComplete="name" />
            <Campo etiqueta="WhatsApp" name="whatsapp" type="tel" placeholder="9XX XXX XXX" autoComplete="tel-national" />
          </div>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <Boton variante="clara" className="min-h-16 pr-[30px] pl-[34px]">
              Enviar solicitud
            </Boton>
            <p className="m-0 max-w-[300px] text-[13px] leading-[1.5] text-garua">
              Al enviar aceptas la{" "}
              <Link href="/privacidad" className="text-lino underline">
                política de privacidad
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
