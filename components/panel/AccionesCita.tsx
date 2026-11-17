"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Boton } from "@/components/ui/Boton";
import { CampoSeleccion, CampoTexto, Campo } from "@/components/ui/Campo";
import { franjas, type FranjaId } from "@/content/zonas";
import { cambiarEstado, marcarEnRevision, type ResultadoAccion } from "@/lib/acciones/citas";
import { horaMasTemprana } from "@/lib/disponibilidad";
import { horasDeFranja, type EstadoCita } from "@/lib/estados";
import { useAhoraLima } from "@/lib/useAhoraLima";

type Props = {
  id: string;
  estado: EstadoCita;
  /** Día de la cita: «completada» se ofrece desde ese día. */
  fecha: string;
  franja: FranjaId;
  rol: "admin" | "barber";
};

function Mensaje({ r }: { r: ResultadoAccion }) {
  if (!r) return null;
  return (
    <p role={r.ok ? "status" : "alert"} className={`m-0 text-[14px] ${r.ok ? "text-tabaco" : "text-huaca-profundo"}`}>
      {r.mensaje}
    </p>
  );
}

/** Un formulario de acción plegable (details/summary, como el Acordeón). */
function Accion({
  titulo,
  estado,
  id,
  abierta,
  boton,
  children,
}: {
  titulo: string;
  estado: EstadoCita;
  id: string;
  abierta?: boolean;
  boton: string;
  children?: ReactNode;
}) {
  const [r, accion, enviando] = useActionState<ResultadoAccion, FormData>(cambiarEstado, null);
  return (
    <details open={abierta} className="acordeon border-b border-obsidiana/20">
      <summary className="font-serif flex min-h-11 items-center justify-between gap-6 py-5 text-[24px] leading-tight">
        {titulo}
        <span className="acordeon__signo text-[28px] text-huaca-profundo" aria-hidden="true">
          +
        </span>
      </summary>
      <form action={accion} className="flex flex-col gap-6 pb-7">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="estado" value={estado} />
        {children}
        <div className="flex flex-wrap items-center gap-4">
          <Boton type="submit" pequena disabled={enviando}>
            {enviando ? "Guardando…" : boton}
          </Boton>
          <Mensaje r={r} />
        </div>
      </form>
    </details>
  );
}

/** `desde`: minutos desde las 0:00 (hoy, la visita debe quedar a una hora o más). */
function SelectorHora({ franja, nombre = "hora", desde = 0 }: { franja: FranjaId; nombre?: string; desde?: number }) {
  const f = franjas.find((x) => x.id === franja)!;
  const horas = horasDeFranja(f.inicio, f.fin).filter((h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3)) >= desde);
  return (
    <CampoSeleccion tono="claro" etiqueta={`Hora exacta (${f.nombre.toLowerCase()} ${f.inicio}–${f.fin})`} name={nombre} required defaultValue="">
      <option value="" disabled>
        Elige la hora
      </option>
      {horas.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </CampoSeleccion>
  );
}

function Propuesta() {
  const ahora = useAhoraLima();
  const [franja, setFranja] = useState<FranjaId>("manana");
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <Campo tono="claro" etiqueta="Día" name="propuestaFecha" type="date" min={ahora?.fecha} required />
      <CampoSeleccion
        tono="claro"
        etiqueta="Franja"
        name="propuestaFranja"
        value={franja}
        onChange={(e) => setFranja(e.currentTarget.value as FranjaId)}
      >
        {franjas.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nombre} · {f.inicio}–{f.fin}
          </option>
        ))}
      </CampoSeleccion>
      <SelectorHora key={franja} franja={franja} nombre="propuestaHora" />
    </div>
  );
}

/**
 * Lo que se puede hacer con una cita según su estado y quién mira.
 * La base de datos vuelve a comprobar cada transición.
 */
export function AccionesCita({ id, estado, fecha, franja, rol }: Props) {
  const ahora = useAhoraLima();
  // «El barbero revisa»: al abrir una solicitud nueva, pasa a «en revisión».
  useEffect(() => {
    if (rol === "barber" && estado === "solicitud_recibida") void marcarEnRevision(id);
  }, [id, estado, rol]);

  const porResponder = estado === "solicitud_recibida" || estado === "pendiente";
  const motivo = (etiqueta: string, requerido = false) => (
    <CampoTexto tono="claro" etiqueta={etiqueta} name="nota" rows={3} required={requerido} />
  );

  if (porResponder) {
    return (
      <div className="border-t border-obsidiana">
        <Accion titulo="Aceptar" estado="confirmada" id={id} abierta boton="Confirmar la cita">
          <SelectorHora franja={franja} desde={ahora && fecha === ahora.fecha ? horaMasTemprana(ahora) : 0} />
          <p className="m-0 text-[13px] text-tabaco">Al confirmar, el cliente recibe el aviso con la hora exacta.</p>
        </Accion>
        <Accion titulo="Proponer otro horario" estado="reprogramacion" id={id} boton="Enviar propuesta">
          <Propuesta />
          {motivo("Nota para el cliente (opcional)")}
        </Accion>
        <Accion titulo="Rechazar" estado="rechazada" id={id} boton="Rechazar la solicitud">
          {motivo("Motivo (lo verá el cliente)", true)}
        </Accion>
        {rol === "admin" && (
          <Accion titulo="Cancelar" estado="cancelada" id={id} boton="Cancelar la solicitud">
            {motivo("Motivo", true)}
          </Accion>
        )}
      </div>
    );
  }

  if (estado === "reprogramacion") {
    if (rol === "barber") {
      return (
        <p className="m-0 border-t border-obsidiana pt-5 text-[15px] text-tabaco">
          Esperando la respuesta del cliente a tu propuesta. La administración registra si la acepta.
        </p>
      );
    }
    return (
      <div className="border-t border-obsidiana">
        <Accion titulo="El cliente aceptó" estado="confirmada" id={id} abierta boton="Confirmar con el nuevo horario">
          <p className="m-0 text-[13px] text-tabaco">La cita pasa al día y la hora propuestos.</p>
        </Accion>
        <Accion titulo="El cliente no acepta" estado="cancelada" id={id} boton="Cancelar la cita">
          {motivo("Nota", false)}
        </Accion>
      </div>
    );
  }

  if (estado === "confirmada") {
    const yaLlego = Boolean(ahora && fecha <= ahora.fecha);
    return (
      <div className="border-t border-obsidiana">
        {yaLlego ? (
          <Accion titulo="Marcar como completada" estado="completada" id={id} boton="Servicio realizado" />
        ) : (
          <p className="m-0 border-b border-obsidiana/20 py-5 text-[15px] text-tabaco">
            Cita confirmada. Podrás marcarla como completada desde el día de la visita.
          </p>
        )}
        {rol === "admin" && (
          <Accion titulo="Cancelar" estado="cancelada" id={id} boton="Cancelar la cita">
            {motivo("Motivo", true)}
          </Accion>
        )}
      </div>
    );
  }

  return null;
}
