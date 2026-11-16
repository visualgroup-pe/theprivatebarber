import { ListaCitas, Seccion } from "@/components/panel/Citas";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { Boton } from "@/components/ui/Boton";
import { exigirRol } from "@/lib/auth";
import { listarCitas } from "@/lib/citas";
import { ahoraEnLima, sumarDias } from "@/lib/disponibilidad";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Resumen del día: lo que espera respuesta, lo que hay que revisar y la agenda. */
export default async function PaginaAdmin() {
  await exigirRol("admin");
  const hoy = ahoraEnLima().fecha;
  const supabase = await crearClienteServidor();
  const [porResponder, esperando, agenda, reclamos] = await Promise.all([
    listarCitas({ estados: ["solicitud_recibida", "pendiente"] }),
    listarCitas({ estados: ["reprogramacion"] }),
    listarCitas({ estados: ["confirmada"], desde: hoy, hasta: sumarDias(hoy, 7) }),
    supabase.from("reclamaciones").select("id", { count: "exact", head: true }).is("respondido_en", null),
  ]);
  const revisarZona = porResponder.filter((c) => c.revision_zona);
  const sinResponder = reclamos.count ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <TituloPanel etiqueta="Administración">
          {porResponder.length} por responder
          <br />
          <em className="text-huaca">{agenda.length} confirmadas esta semana.</em>
        </TituloPanel>
        <Boton href="/admin/citas/nueva" pequena className="mb-10">
          Registrar solicitud de WhatsApp
        </Boton>
      </div>

      {sinResponder > 0 && (
        <p className="mb-10 border border-huaca-profundo p-4 text-[15px] text-obsidiana">
          {sinResponder === 1 ? "Hay 1 reclamación" : `Hay ${sinResponder} reclamaciones`} sin respuesta. El plazo legal es de 15
          días hábiles.{" "}
          <a href="/admin/reclamaciones" className="underline underline-offset-4">
            Ver reclamaciones
          </a>
        </p>
      )}

      {revisarZona.length > 0 && (
        <Seccion titulo="Revisar zona (otro distrito)" cuenta={revisarZona.length}>
          <ListaCitas citas={revisarZona} base="/admin/citas" vacio="" mostrarBarbero />
        </Seccion>
      )}
      <Seccion titulo="Por responder del barbero" cuenta={porResponder.length}>
        <ListaCitas citas={porResponder} base="/admin/citas" vacio="No hay solicitudes pendientes." mostrarBarbero />
      </Seccion>
      <Seccion titulo="Esperando respuesta del cliente" cuenta={esperando.length}>
        <ListaCitas citas={esperando} base="/admin/citas" vacio="No hay propuestas de horario pendientes." mostrarBarbero />
      </Seccion>
      <Seccion titulo="Próximos 7 días" cuenta={agenda.length}>
        <ListaCitas citas={agenda} base="/admin/citas" vacio="No hay citas confirmadas esta semana." mostrarBarbero />
      </Seccion>
    </>
  );
}
