"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Logo } from "@/components/marca/Logo";
import { CLAVE_RESUMEN } from "@/components/reserva/useSolicitud";
import type { FranjaId } from "@/content/zonas";
import { enlaceWhatsApp } from "@/lib/contacto";
import { fechaLarga, franjaTexto } from "@/lib/disponibilidad";
import type { ResumenSolicitud } from "@/lib/esquemas/solicitud";
import { soles } from "@/lib/tokens";

const LUGAR = { casa: "Casa", oficina: "Oficina", hotel: "Hotel" } as const;

function leerResumen(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_RESUMEN);
  } catch {
    return null;
  }
}

/** «Hoy, 21:14» o «12 dic, 21:14», en hora de Lima. */
function cuando(iso: string): string {
  const d = new Date(iso);
  const opciones = { timeZone: "America/Lima" } as const;
  const dia = d.toLocaleDateString("es-PE", { ...opciones, day: "numeric", month: "short" }).replace(".", "");
  const hoy = new Date().toLocaleDateString("es-PE", { ...opciones, day: "numeric", month: "short" }).replace(".", "");
  const hora = d.toLocaleTimeString("es-PE", { ...opciones, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${dia === hoy ? "Hoy" : dia}, ${hora}`;
}

const boton =
  "flex min-h-14 w-full items-center justify-between bg-obsidiana px-[22px] text-[13px] font-medium tracking-[0.16em] text-lino uppercase no-underline";

/**
 * «Solicitud enviada» (pantalla móvil 4 del lienzo). El resumen viene de
 * sessionStorage: no viaja en la URL, así nadie más ve los datos del cliente.
 */
export function Confirmacion() {
  const crudo = useSyncExternalStore(
    () => () => {},
    leerResumen,
    () => null,
  );
  let r: ResumenSolicitud | null = null;
  try {
    r = crudo ? (JSON.parse(crudo) as ResumenSolicitud) : null;
  } catch {
    r = null;
  }

  const primerNombre = r?.nombre.trim().split(/\s+/)[0];
  const mensajeWhatsapp = r
    ? `Hola, acabo de enviar una solicitud de cita: ${r.servicio}${r.conAsesoria ? " + asesoría" : ""}, ${fechaLarga(r.fecha)}, ${franjaTexto(r.franja as FranjaId, false)}, con ${r.barbero}.`
    : undefined;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-lino text-obsidiana">
      <header className="px-5 pt-[18px]">
        <div className="flex h-11 items-center justify-center">
          <Link href="/" aria-label="The Private Barber, inicio" className="leading-none">
            <Logo alto={20} eager />
          </Link>
        </div>
        <p className="etiqueta-sm mt-10 mb-0 text-huaca-profundo">Solicitud enviada</p>
        <h1 className="font-serif mt-3.5 mb-0 text-[46px] leading-[0.95] tracking-[-0.02em]">
          {r ? `Gracias, ${primerNombre}.` : "Recibimos tu solicitud."}
          <br />
          <em className="text-huaca">{r ? `Ya la tiene ${r.barbero}.` : "Ya la tiene el barbero."}</em>
        </h1>
        <p className="mt-[18px] mb-0 text-[15px] leading-[1.55] text-tabaco">
          Tu cita aún no está confirmada. Te escribiremos por WhatsApp en cuanto el barbero la acepte.
        </p>
      </header>

      <main className="px-5 pt-[26px]">
        <ol className="relative m-0 list-none p-0">
          <span aria-hidden="true" className="absolute top-3 bottom-[30px] left-[7px] w-px bg-[#C9A592]" />
          {[
            { titulo: "Solicitud recibida", texto: r ? cuando(r.creadoEn) : "Hace un momento", hecho: true },
            { titulo: "El barbero revisa", texto: "Acepta o te propone otro horario", hecho: false },
            { titulo: "Confirmación por WhatsApp", texto: "Con la hora exacta de la visita", hecho: false },
          ].map((p, i, todos) => (
            <li
              key={p.titulo}
              className={`relative grid grid-cols-[22px_1fr] gap-3.5 ${i < todos.length - 1 ? "pb-[22px]" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`mt-[3px] size-[15px] rounded-full ${p.hecho ? "bg-huaca" : "border border-huaca bg-lino"}`}
              />
              <div>
                <p className="m-0 text-[15px] font-semibold">{p.titulo}</p>
                <p className="mt-[3px] mb-0 text-[13px] leading-[1.45] text-tabaco">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        {r && (
          <div className="mt-[26px] bg-piedra p-[18px]">
            <div className="flex justify-between gap-3 border-b border-obsidiana/15 pb-2.5 text-[14px]">
              <span>
                {r.servicio}
                {r.conAsesoria ? " + asesoría" : ""}
              </span>
              <span className="font-mono">{soles(r.totalPen)}</span>
            </div>
            <p className="mt-2.5 mb-0 text-[13px] leading-[1.5] text-tabaco">
              {fechaLarga(r.fecha)} · {franjaTexto(r.franja as FranjaId, false)} ({franjaTexto(r.franja as FranjaId).split(" · ")[1]})
              <br />
              {LUGAR[r.lugar]} · {r.distrito}
              {r.revisionZona && (
                <>
                  <br />
                  Te confirmamos si podemos llegar a tu distrito.
                </>
              )}
            </p>
          </div>
        )}
      </main>

      <div className="mt-auto flex flex-col gap-1.5 px-5 pt-4 pb-[26px]">
        <Link href="/" className={boton}>
          Volver al inicio <span aria-hidden="true">→</span>
        </Link>
        <a
          href={enlaceWhatsApp(mensajeWhatsapp, "/#reserva")}
          className="flex min-h-11 items-center justify-center text-[13px] tracking-[0.12em] uppercase underline underline-offset-4"
        >
          Escribir por WhatsApp
        </a>
      </div>
    </div>
  );
}
