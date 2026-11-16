import Link from "next/link";
import type { ReactNode } from "react";
import type { FranjaId } from "@/content/zonas";
import { distritoDe, type Cita } from "@/lib/citas";
import { fechaCorta, franjaTexto } from "@/lib/disponibilidad";
import { ESTADOS, LUGARES, type EstadoCita } from "@/lib/estados";
import { soles } from "@/lib/tokens";

export function ChipEstado({ estado }: { estado: EstadoCita }) {
  const e = ESTADOS[estado];
  return (
    <span className={`inline-flex min-h-6 items-center border px-2 text-[11px] font-medium tracking-[0.08em] uppercase ${e.clase}`}>
      {e.nombre}
    </span>
  );
}

export function cuandoCita(c: Pick<Cita, "fecha" | "franja" | "hora_confirmada">): string {
  const hora = c.hora_confirmada ? c.hora_confirmada.slice(0, 5) : franjaTexto(c.franja as FranjaId);
  return `${fechaCorta(c.fecha)} · ${hora}`;
}

/** Lista de citas como tarjetas (móvil primero), con enlace al detalle. */
export function ListaCitas({
  citas,
  base,
  vacio,
  mostrarBarbero = false,
}: {
  citas: Cita[];
  base: string;
  vacio: ReactNode;
  mostrarBarbero?: boolean;
}) {
  if (citas.length === 0) return <p className="m-0 border-t border-piedra py-6 text-[15px] text-tabaco">{vacio}</p>;
  return (
    <ul className="m-0 list-none border-t border-obsidiana p-0">
      {citas.map((c) => (
        <li key={c.id} className="border-b border-piedra">
          <Link
            href={`${base}/${c.id}`}
            className="grid grid-cols-1 gap-x-6 gap-y-2 py-5 no-underline transition-[padding] duration-500 hover:pl-2 sm:grid-cols-[1fr_auto]"
          >
            <span className="flex flex-col gap-1.5">
              <span className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[14px]">{cuandoCita(c)}</span>
                <ChipEstado estado={c.estado} />
                {c.revision_zona && (
                  <span className="border border-huaca-profundo px-2 text-[11px] tracking-[0.08em] text-huaca-profundo uppercase">
                    Revisar zona
                  </span>
                )}
              </span>
              <span className="font-serif text-[24px] leading-tight">
                {c.cliente?.nombre ?? "Cliente"} · {c.servicio?.nombre ?? "Servicio"}
                {c.con_asesoria ? " + asesoría" : ""}
              </span>
              <span className="text-[13px] text-tabaco">
                {c.lugar ? LUGARES[c.lugar] : "—"} · {distritoDe(c)}
                {mostrarBarbero && c.barbero ? ` · ${c.barbero.nombre}` : ""}
                {c.origen === "whatsapp" ? " · por WhatsApp" : ""}
              </span>
            </span>
            <span className="font-mono text-[16px] sm:text-right">{soles(c.precio_total_pen ?? 0)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Seccion({ titulo, cuenta, children }: { titulo: string; cuenta?: number; children: ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="etiqueta m-0 mb-4 flex items-baseline gap-3 text-tabaco">
        {titulo}
        {cuenta !== undefined && <span className="font-mono text-[12px] text-huaca-profundo">{cuenta}</span>}
      </h2>
      {children}
    </section>
  );
}
