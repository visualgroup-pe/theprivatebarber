import { FormAccion } from "@/components/panel/FormAccion";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { Campo, CampoSeleccion } from "@/components/ui/Campo";
import { franjas } from "@/content/zonas";
import { exigirRol } from "@/lib/auth";
import { obtenerBarberos, obtenerServicios, obtenerZonas } from "@/lib/catalogo";
import { describirDias } from "@/lib/disponibilidad";
import { OTRO_DISTRITO_ID } from "@/lib/esquemas/solicitud";
import { soles } from "@/lib/tokens";
import { registrarSolicitud } from "../../acciones";

export const metadata = { title: "Registrar solicitud" };

const casilla = "flex min-h-11 items-start gap-3 text-[14px] leading-[1.45]";

/** Solicitud que llegó por WhatsApp: la administración la registra a mano. */
export default async function PaginaNuevaCita() {
  await exigirRol("admin");
  const [servicios, zonas, barberos] = await Promise.all([obtenerServicios(), obtenerZonas(), obtenerBarberos()]);
  const principales = servicios.filter((s) => !s.esAdicional);
  const asesoria = servicios.find((s) => s.esAdicional);

  return (
    <>
      <TituloPanel etiqueta="Citas">
        Registrar una solicitud
        <br />
        <em className="text-huaca">de WhatsApp.</em>
      </TituloPanel>
      <p className="mb-10 max-w-[560px] text-[15px] leading-[1.6] text-tabaco">
        Queda como «solicitud recibida» para el barbero, igual que las de la web, y con origen WhatsApp en su historial.
      </p>
      <FormAccion accion={registrarSolicitud} boton="Registrar solicitud" etiqueta="Nueva solicitud" className="max-w-[760px] gap-8">
        <div className="grid grid-cols-1 gap-x-7 gap-y-8 md:grid-cols-2">
          <CampoSeleccion tono="claro" etiqueta="Servicio" name="servicioId" required defaultValue="">
            <option value="" disabled>
              Elige el servicio
            </option>
            {principales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} · {soles(s.precioPen)}
              </option>
            ))}
          </CampoSeleccion>
          {asesoria && (
            <label className={`${casilla} self-end`}>
              <input type="checkbox" name="conAsesoria" className="mt-0.5 size-[18px] shrink-0 accent-obsidiana" />+{" "}
              {asesoria.nombre} · {soles(asesoria.precioPen)}
            </label>
          )}
          <CampoSeleccion tono="claro" etiqueta="Barbero" name="barberoId" required defaultValue="">
            <option value="" disabled>
              Elige el barbero
            </option>
            {barberos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} · {describirDias(b.horarios).corto}
              </option>
            ))}
          </CampoSeleccion>
          <Campo tono="claro" etiqueta="Día" name="fecha" type="date" required />
          <CampoSeleccion tono="claro" etiqueta="Franja" name="franja" required defaultValue="">
            <option value="" disabled>
              Elige la franja
            </option>
            {franjas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre} · {f.inicio}–{f.fin}
              </option>
            ))}
          </CampoSeleccion>
          <CampoSeleccion tono="claro" etiqueta="Lugar" name="lugar" defaultValue="casa">
            <option value="casa">Casa</option>
            <option value="oficina">Oficina</option>
            <option value="hotel">Hotel</option>
          </CampoSeleccion>
          <CampoSeleccion tono="claro" etiqueta="Distrito" name="zonaId" required defaultValue="">
            <option value="" disabled>
              Elige el distrito
            </option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.distrito}
              </option>
            ))}
            <option value={OTRO_DISTRITO_ID}>Otro distrito</option>
          </CampoSeleccion>
          <Campo tono="claro" etiqueta="Si es otro distrito, ¿cuál?" name="distritoOtro" />
          <Campo tono="claro" etiqueta="Dirección y referencia" name="direccion" required className="md:col-span-2" />
          <Campo tono="claro" etiqueta="Nombre del cliente" name="nombre" required />
          <Campo tono="claro" etiqueta="WhatsApp" name="whatsapp" type="tel" placeholder="9XX XXX XXX" required />
          <Campo tono="claro" etiqueta="Correo (opcional)" name="correo" type="email" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={casilla}>
            <input type="checkbox" name="consentimientoDatos" required className="mt-0.5 size-[18px] shrink-0 accent-obsidiana" />
            El cliente autorizó el uso de sus datos para gestionar la cita.
          </label>
          <label className={casilla}>
            <input type="checkbox" name="consentimientoMarketing" className="mt-0.5 size-[18px] shrink-0 accent-obsidiana" />
            El cliente aceptó recibir novedades y promociones.
          </label>
        </div>
      </FormAccion>
    </>
  );
}
