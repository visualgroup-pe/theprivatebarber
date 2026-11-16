import { FormAccion } from "@/components/panel/FormAccion";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { Campo } from "@/components/ui/Campo";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { crearServicio, guardarServicio } from "../acciones";

export const metadata = { title: "Servicios y precios" };

type Valores = {
  id?: string;
  nombre?: string;
  descripcion?: string;
  descripcion_corta?: string;
  duracion_texto?: string;
  precio_pen?: number;
  orden?: number;
  activo?: boolean;
};

function CamposServicio({ s }: { s: Valores }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-[2fr_1fr_1fr]">
      {s.id && <input type="hidden" name="id" value={s.id} />}
      <Campo tono="claro" etiqueta="Nombre" name="nombre" defaultValue={s.nombre} required id={`nombre-${s.id ?? "nuevo"}`} />
      <Campo
        tono="claro"
        etiqueta="Precio (S/, IGV incluido)"
        name="precio_pen"
        type="number"
        min={0}
        step={1}
        defaultValue={s.precio_pen}
        required
        id={`precio-${s.id ?? "nuevo"}`}
      />
      <Campo tono="claro" etiqueta="Orden" name="orden" type="number" min={0} defaultValue={s.orden ?? 10} id={`orden-${s.id ?? "nuevo"}`} />
      <Campo
        tono="claro"
        etiqueta="Descripción (carta)"
        name="descripcion"
        defaultValue={s.descripcion}
        className="md:col-span-2"
        id={`desc-${s.id ?? "nuevo"}`}
      />
      <Campo tono="claro" etiqueta="Duración (texto)" name="duracion_texto" defaultValue={s.duracion_texto} id={`dur-${s.id ?? "nuevo"}`} />
      <Campo
        tono="claro"
        etiqueta="Descripción corta (reserva en móvil)"
        name="descripcion_corta"
        defaultValue={s.descripcion_corta}
        className="md:col-span-2"
        id={`corta-${s.id ?? "nuevo"}`}
      />
      <label className="flex min-h-11 items-center gap-3 self-end text-[14px]">
        <input type="checkbox" name="activo" defaultChecked={s.activo ?? true} className="size-[18px] accent-obsidiana" />
        Visible en la web
      </label>
    </div>
  );
}

/** Carta y precios. Un cambio se ve en la web al instante; las citas ya creadas conservan su precio. */
export default async function PaginaServicios() {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();
  const { data: servicios } = await supabase.from("servicios").select("*").order("orden");

  return (
    <>
      <TituloPanel etiqueta="Carta">Servicios y precios</TituloPanel>
      <p className="mb-10 max-w-[620px] text-[15px] leading-[1.6] text-tabaco">
        Los precios están en soles con IGV incluido. Cambiarlos no altera las citas ya solicitadas: cada cita guarda el
        precio del momento en que se pidió.
      </p>
      <div className="flex flex-col border-t border-obsidiana">
        {(servicios ?? []).map((s) => (
          <section key={s.id} className="border-b border-piedra py-8" aria-label={s.nombre}>
            <h2 className="font-serif m-0 mb-6 text-[28px] leading-none">
              {s.nombre}
              {s.es_adicional && <span className="etiqueta-sm ml-3 align-middle text-huaca-profundo">Adicional</span>}
            </h2>
            <FormAccion accion={guardarServicio} boton="Guardar" etiqueta={`Editar ${s.nombre}`}>
              <CamposServicio s={s} />
            </FormAccion>
          </section>
        ))}
      </div>
      <section className="mt-14" aria-label="Nuevo servicio">
        <h2 className="etiqueta m-0 mb-6 text-tabaco">Nuevo servicio principal</h2>
        <FormAccion accion={crearServicio} boton="Agregar servicio" etiqueta="Nuevo servicio">
          <CamposServicio s={{}} />
        </FormAccion>
      </section>
    </>
  );
}
