import { FormAccion } from "@/components/panel/FormAccion";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { Campo } from "@/components/ui/Campo";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { guardarZona } from "../acciones";

export const metadata = { title: "Zonas" };

/** Distritos de atención. Uno inactivo deja de ofrecerse en el formulario. */
export default async function PaginaZonas() {
  await exigirRol("admin");
  const supabase = await crearClienteServidor();
  const { data: zonas } = await supabase.from("zonas").select("*").order("orden");

  return (
    <>
      <TituloPanel etiqueta="Zonas">Dónde atendemos</TituloPanel>
      <div className="flex max-w-[820px] flex-col border-t border-obsidiana">
        {(zonas ?? []).map((z) => (
          <div key={z.id} className="border-b border-piedra py-6">
            <FormAccion accion={guardarZona} boton="Guardar" etiqueta={`Editar ${z.distrito}`}>
              <div className="grid grid-cols-1 items-end gap-6 sm:grid-cols-[2fr_1fr_auto]">
                <input type="hidden" name="id" value={z.id} />
                <Campo tono="claro" etiqueta="Distrito" name="distrito" defaultValue={z.distrito} id={`distrito-${z.id}`} />
                <Campo tono="claro" etiqueta="Orden" name="orden" type="number" min={0} defaultValue={z.orden} id={`orden-${z.id}`} />
                <label className="flex min-h-11 items-center gap-3 text-[14px]">
                  <input type="checkbox" name="activo" defaultChecked={z.activo} className="size-[18px] accent-obsidiana" />
                  Activa
                </label>
              </div>
            </FormAccion>
          </div>
        ))}
      </div>
      <section className="mt-14 max-w-[820px]" aria-label="Nueva zona">
        <h2 className="etiqueta m-0 mb-6 text-tabaco">Agregar distrito</h2>
        <FormAccion accion={guardarZona} boton="Agregar" etiqueta="Nueva zona">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[2fr_1fr]">
            <Campo tono="claro" etiqueta="Distrito" name="distrito" required id="distrito-nuevo" />
            <Campo tono="claro" etiqueta="Orden" name="orden" type="number" min={0} defaultValue={10} id="orden-nuevo" />
          </div>
        </FormAccion>
      </section>
    </>
  );
}
