import { ListaCitas, Seccion } from "@/components/panel/Citas";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { exigirRol } from "@/lib/auth";
import { listarCitas } from "@/lib/citas";
import { ahoraEnLima } from "@/lib/disponibilidad";

/** Solicitudes y agenda del barbero (solo sus citas: lo asegura RLS). */
export default async function PaginaBarbero() {
  const usuario = await exigirRol("barber");
  if (!usuario.barberoId) {
    return (
      <>
        <TituloPanel etiqueta="Panel del barbero">Tu cuenta aún no está vinculada.</TituloPanel>
        <p className="max-w-[520px] text-[16px] leading-[1.6] text-tabaco">
          Pide a la administración que vincule tu cuenta con tu ficha de barbero para ver tus solicitudes.
        </p>
      </>
    );
  }

  const hoy = ahoraEnLima().fecha;
  const [porResponder, esperando, agenda, historial] = await Promise.all([
    listarCitas({ estados: ["solicitud_recibida", "pendiente"] }),
    listarCitas({ estados: ["reprogramacion"] }),
    listarCitas({ estados: ["confirmada"], desde: hoy }),
    listarCitas({ estados: ["completada", "rechazada", "cancelada"], recientes: true, limite: 10 }),
  ]);
  const deHoy = agenda.filter((c) => c.fecha === hoy);

  return (
    <>
      <TituloPanel etiqueta={`Hola, ${usuario.nombre}`}>
        {porResponder.length > 0 ? (
          <>
            {porResponder.length} {porResponder.length === 1 ? "solicitud espera" : "solicitudes esperan"}
            <br />
            <em className="text-huaca">tu respuesta.</em>
          </>
        ) : (
          <>
            Todo respondido.
            <br />
            <em className="text-huaca">{deHoy.length ? `${deHoy.length} ${deHoy.length === 1 ? "cita" : "citas"} hoy.` : "Buen día."}</em>
          </>
        )}
      </TituloPanel>

      <Seccion titulo="Por responder" cuenta={porResponder.length}>
        <ListaCitas citas={porResponder} base="/barbero/cita" vacio="No tienes solicitudes nuevas." />
      </Seccion>
      <Seccion titulo="Agenda" cuenta={agenda.length}>
        <ListaCitas citas={agenda} base="/barbero/cita" vacio="No tienes citas confirmadas próximas." />
      </Seccion>
      {esperando.length > 0 && (
        <Seccion titulo="Esperando respuesta del cliente" cuenta={esperando.length}>
          <ListaCitas citas={esperando} base="/barbero/cita" vacio="" />
        </Seccion>
      )}
      <Seccion titulo="Últimas cerradas">
        <ListaCitas citas={historial} base="/barbero/cita" vacio="Aún no hay citas cerradas." />
      </Seccion>
    </>
  );
}
