import { FormAccion } from "@/components/panel/FormAccion";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { CampoTexto } from "@/components/ui/Campo";
import { exigirRol } from "@/lib/auth";
import { ahoraEnLima } from "@/lib/disponibilidad";
import { crearClienteServidor } from "@/lib/supabase/server";
import { soles } from "@/lib/tokens";
import { responderReclamacion } from "../acciones";

export const metadata = { title: "Reclamaciones" };

/** Días hábiles (lunes a viernes) entre dos fechas; no descuenta feriados. */
function diasHabiles(desde: string, hasta: string): number {
  let n = 0;
  const d = new Date(`${desde}T12:00:00Z`);
  const fin = new Date(`${hasta}T12:00:00Z`);
  while (d < fin) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dia = d.getUTCDay();
    if (dia !== 0 && dia !== 6) n++;
  }
  return n;
}

const fechaLima = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Lima" });

/** Libro de Reclamaciones: hojas recibidas, plazo y respuesta. */
export default async function PaginaReclamaciones() {
  await exigirRol("admin");
  const hoy = ahoraEnLima().fecha;
  const supabase = await crearClienteServidor();
  const { data: hojas } = await supabase.from("reclamaciones").select("*").order("creado_en", { ascending: false });

  return (
    <>
      <TituloPanel etiqueta="Libro de Reclamaciones">Hojas recibidas</TituloPanel>
      <p className="mb-10 max-w-[620px] text-[15px] leading-[1.6] text-tabaco">
        El plazo para responder es de 15 días hábiles. El conteo de abajo no descuenta feriados.
      </p>
      {(hojas ?? []).length === 0 && <p className="border-t border-piedra py-6 text-[15px] text-tabaco">No hay hojas registradas.</p>}
      <div className="flex flex-col border-t border-obsidiana">
        {(hojas ?? []).map((h) => {
          const usados = diasHabiles(fechaLima(h.creado_en), hoy);
          return (
            <details key={h.id} className="acordeon border-b border-piedra">
              <summary className="flex min-h-11 flex-wrap items-center justify-between gap-4 py-5">
                <span className="flex flex-wrap items-baseline gap-3">
                  <span className="font-mono text-[15px]">N.° {h.correlativo}</span>
                  <span className="font-serif text-[24px] leading-none">{h.nombre}</span>
                  <span className="etiqueta-sm text-tabaco">{h.tipo === "reclamo" ? "Reclamo" : "Queja"}</span>
                </span>
                <span className={`text-[13px] ${h.respondido_en ? "text-tabaco" : usados >= 10 ? "font-semibold text-huaca-profundo" : ""}`}>
                  {h.respondido_en ? "Respondida" : `${usados} de 15 días hábiles`}
                </span>
              </summary>
              <div className="grid grid-cols-1 gap-8 pb-8 lg:grid-cols-2">
                <dl className="m-0 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-[14px]">
                  <dt className="text-tabaco">Recibida</dt>
                  <dd className="m-0">{new Date(h.creado_en).toLocaleString("es-PE", { timeZone: "America/Lima" })}</dd>
                  <dt className="text-tabaco">Documento</dt>
                  <dd className="m-0">
                    {h.tipo_documento} {h.numero_documento}
                  </dd>
                  <dt className="text-tabaco">Domicilio</dt>
                  <dd className="m-0">{h.domicilio}</dd>
                  <dt className="text-tabaco">Teléfono</dt>
                  <dd className="m-0">{h.telefono}</dd>
                  <dt className="text-tabaco">Correo</dt>
                  <dd className="m-0">{h.correo}</dd>
                  {h.menor_de_edad && (
                    <>
                      <dt className="text-tabaco">Apoderado</dt>
                      <dd className="m-0">{h.apoderado}</dd>
                    </>
                  )}
                  <dt className="text-tabaco">Bien contratado</dt>
                  <dd className="m-0">
                    {h.tipo_bien === "servicio" ? "Servicio" : "Producto"}: {h.descripcion_bien}
                    {h.monto_reclamado != null && ` · ${soles(Number(h.monto_reclamado))}`}
                  </dd>
                  <dt className="text-tabaco">Detalle</dt>
                  <dd className="m-0 whitespace-pre-line">{h.detalle}</dd>
                  <dt className="text-tabaco">Pedido</dt>
                  <dd className="m-0 whitespace-pre-line">{h.pedido}</dd>
                </dl>
                <FormAccion accion={responderReclamacion} boton={h.respondido_en ? "Actualizar respuesta" : "Guardar respuesta"} etiqueta={`Responder ${h.correlativo}`}>
                  <input type="hidden" name="id" value={h.id} />
                  <CampoTexto tono="claro" etiqueta="Respuesta del proveedor" name="respuesta" rows={6} defaultValue={h.respuesta ?? ""} id={`resp-${h.id}`} />
                </FormAccion>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
