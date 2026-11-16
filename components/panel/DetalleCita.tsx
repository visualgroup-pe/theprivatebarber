import Link from "next/link";
import type { FranjaId } from "@/content/zonas";
import type { Cita, EventoCita } from "@/lib/citas";
import { distritoDe } from "@/lib/citas";
import { fechaLarga, franjaTexto } from "@/lib/disponibilidad";
import { ESTADOS, LUGARES } from "@/lib/estados";
import { soles } from "@/lib/tokens";
import { AccionesCita } from "./AccionesCita";
import { ChipEstado } from "./Citas";

const ACTOR = { cliente: "Cliente", barber: "Barbero", admin: "Administración", sistema: "Sistema" } as const;

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 border-b border-piedra py-3 text-[15px]">
      <dt className="text-tabaco">{etiqueta}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

const momento = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

/** Detalle de una cita, con su historial y las acciones posibles. */
export function DetalleCita({
  cita: c,
  eventos,
  rol,
  volver,
}: {
  cita: Cita;
  eventos: EventoCita[];
  rol: "admin" | "barber";
  volver: string;
}) {
  const franja = c.franja as FranjaId;
  const wsp = c.cliente?.whatsapp;
  return (
    <div>
      <Link href={volver} className="enlace mb-6 text-tabaco">
        <span className="flecha rotate-180" aria-hidden="true">
          →
        </span>
        <span className="enlace__texto">Volver</span>
      </Link>
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <ChipEstado estado={c.estado} />
        {c.revision_zona && (
          <span className="border border-huaca-profundo px-2 text-[11px] tracking-[0.08em] text-huaca-profundo uppercase">
            Revisar zona
          </span>
        )}
      </div>
      <h1 className="font-serif m-0 text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.02em]">
        {c.cliente?.nombre ?? "Cliente"}
        <br />
        <em className="text-huaca">
          {c.servicio?.nombre ?? "Servicio"}
          {c.con_asesoria ? " + asesoría" : ""}
        </em>
      </h1>

      <div className="mt-12 grid grid-cols-1 gap-14 lg:grid-cols-[7fr_5fr]">
        <div>
          <dl className="m-0 border-t border-obsidiana">
            <Fila etiqueta="Día">{fechaLarga(c.fecha)}</Fila>
            <Fila etiqueta="Hora">
              {c.hora_confirmada ? (
                <span className="font-mono">{c.hora_confirmada.slice(0, 5)}</span>
              ) : (
                <>Por fijar · {franjaTexto(franja)}</>
              )}
            </Fila>
            {c.estado === "reprogramacion" && c.propuesta_fecha && (
              <Fila etiqueta="Propuesta">
                {fechaLarga(c.propuesta_fecha)} ·{" "}
                <span className="font-mono">{c.propuesta_hora?.slice(0, 5)}</span>
              </Fila>
            )}
            <Fila etiqueta="Lugar">
              {c.lugar ? LUGARES[c.lugar] : "—"} · {distritoDe(c)}
            </Fila>
            <Fila etiqueta="Dirección">{c.direccion ?? "—"}</Fila>
            {c.referencia && <Fila etiqueta="Referencia">{c.referencia}</Fila>}
            <Fila etiqueta="WhatsApp">
              {wsp ? (
                <a href={`https://wa.me/51${wsp}`} className="font-mono underline underline-offset-4">
                  {wsp.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                </a>
              ) : (
                "—"
              )}
            </Fila>
            {c.cliente?.correo && <Fila etiqueta="Correo">{c.cliente.correo}</Fila>}
            {rol === "admin" && c.barbero && <Fila etiqueta="Barbero">{c.barbero.nombre}</Fila>}
            <Fila etiqueta="Precio">
              <span className="font-mono">{soles(c.precio_total_pen ?? 0)}</span>
              {c.con_asesoria && (
                <span className="text-[13px] text-tabaco">
                  {" "}
                  ({soles(c.precio_servicio_pen)} + asesoría {soles(c.precio_asesoria_pen)})
                </span>
              )}
            </Fila>
            <Fila etiqueta="Origen">{c.origen === "whatsapp" ? "WhatsApp (registrada a mano)" : "Web"}</Fila>
            {c.motivo && <Fila etiqueta="Motivo">{c.motivo}</Fila>}
          </dl>

          <div className="mt-12">
            <AccionesCita id={c.id} estado={c.estado} fecha={c.fecha} franja={franja} rol={rol} />
          </div>
        </div>

        <aside>
          <h2 className="etiqueta m-0 mb-4 text-tabaco">Historial</h2>
          <ol className="relative m-0 list-none border-t border-obsidiana p-0 pt-5">
            {eventos.map((e) => (
              <li key={e.id} className="grid grid-cols-[22px_1fr] gap-3 pb-5">
                <span aria-hidden="true" className="mt-1 size-[11px] rounded-full bg-huaca" />
                <div>
                  <p className="m-0 text-[15px] font-semibold">{ESTADOS[e.estado_nuevo].nombre}</p>
                  <p className="m-0 mt-0.5 text-[13px] text-tabaco">
                    {momento(e.creado_en)} · {ACTOR[e.actor as keyof typeof ACTOR] ?? e.actor}
                  </p>
                  {e.nota && <p className="m-0 mt-1 text-[14px] leading-[1.45]">{e.nota}</p>}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
