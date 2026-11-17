import Link from "next/link";
import { notFound } from "next/navigation";
import { FormAccion } from "@/components/panel/FormAccion";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { ChipPostulacion } from "@/components/panel/Postulaciones";
import { Campo, CampoSeleccion, CampoTexto } from "@/components/ui/Campo";
import {
  DIAS_SEMANA,
  ESTADOS_POSTULACION,
  MOVILIDAD,
  requisitos,
  TECNICAS,
  type EstadoPostulacion,
} from "@/content/convocatoria";
import { franjas } from "@/content/zonas";
import { exigirRol } from "@/lib/auth";
import { BUCKET_POSTULACIONES, enlaceInstagram } from "@/lib/convocatoria";
import { crearClienteServidor } from "@/lib/supabase/server";
import { actualizarPostulacion, borrarPostulacion, crearBarberoDesdePostulacion } from "../../acciones";

export const metadata = { title: "Postulación" };

const nombreDe = <T extends { id: string; nombre: string }>(lista: readonly T[], id: string) =>
  lista.find((x) => x.id === id)?.nombre ?? id;

/** Una postulación: datos, requisitos, fotos y gestión. */
export default async function PaginaPostulacion({ params }: PageProps<"/admin/postulaciones/[id]">) {
  await exigirRol("admin");
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: p } = await supabase.from("postulaciones").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();

  // Fotos en el bucket privado: URLs firmadas por una hora (RLS de Storage: solo admin).
  const { data: firmadas } = p.fotos.length
    ? await supabase.storage.from(BUCKET_POSTULACIONES).createSignedUrls(p.fotos, 3600)
    : { data: [] };
  const fotos = (firmadas ?? []).flatMap((f) => (f.signedUrl && f.path ? [{ path: f.path, url: f.signedUrl }] : []));
  const faltan = new Set(p.requisitos_faltantes);

  const fila = "grid grid-cols-[150px_1fr] gap-x-4 border-b border-piedra py-2.5 text-[14px]";
  const datos: Array<[string, React.ReactNode]> = [
    [
      "Recibida",
      new Date(p.creado_en).toLocaleString("es-PE", {
        timeZone: "America/Lima",
      }),
    ],
    ["Documento", `${p.tipo_documento} ${p.numero_documento}`],
    [
      "WhatsApp",
      <a
        key="w"
        href={`https://wa.me/51${p.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4"
      >
        {p.whatsapp.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
      </a>,
    ],
    ["Correo", p.correo ?? "—"],
    ["Vive en", p.distrito_residencia],
    ["Años de oficio", String(p.anos_oficio)],
    ["Domina", p.tecnicas.map((t) => nombreDe(TECNICAS, t)).join(", ") || "—"],
    ["Especialidad", p.especialidad ?? "—"],
    [
      "Experiencia",
      <span key="e" className="whitespace-pre-line">
        {p.experiencia}
      </span>,
    ],
    [
      "A domicilio",
      p.experiencia_domicilio ? "Ya ha atendido a domicilio, oficinas u hoteles" : "Sin experiencia a domicilio",
    ],
    [
      "Instagram",
      p.instagram ? (
        <a
          key="i"
          href={enlaceInstagram(p.instagram)}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          {p.instagram}
        </a>
      ) : (
        "—"
      ),
    ],
    ["Días", p.dias.map((d) => DIAS_SEMANA[d - 1]).join(", ")],
    ["Franjas", p.franjas.map((f) => franjas.find((x) => x.id === f)?.nombre ?? f).join(", ")],
    ["Distritos", p.zonas.join(", ") || "—"],
    ["Movilidad", nombreDe(MOVILIDAD, p.movilidad)],
    [
      "Mensaje",
      p.mensaje ? (
        <span key="m" className="whitespace-pre-line">
          {p.mensaje}
        </span>
      ) : (
        "—"
      ),
    ],
  ];

  return (
    <>
      <p className="m-0 mb-6 text-[14px]">
        <Link href="/admin/postulaciones" className="underline underline-offset-4">
          ← Convocatoria
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <TituloPanel etiqueta="Postulación">{p.nombre}</TituloPanel>
      </div>
      <div className="-mt-6 mb-10 flex flex-wrap items-center gap-3">
        <ChipPostulacion estado={p.estado} />
        <span className={`text-[14px] font-semibold ${p.cumple_requisitos ? "text-obsidiana" : "text-huaca-profundo"}`}>
          {p.cumple_requisitos
            ? "Cumple los requisitos"
            : `No cumple ${faltan.size} de ${requisitos.length} requisitos`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-12">
          <section aria-labelledby="fotos-t">
            <h2 id="fotos-t" className="etiqueta m-0 mb-4 text-tabaco">
              Trabajos
            </h2>
            {fotos.length === 0 ? (
              <p className="m-0 text-[15px] text-tabaco">Sin fotos{p.instagram ? ": revisa su Instagram." : "."}</p>
            ) : (
              <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3" aria-label="Fotos de trabajos">
                {fotos.map((f, i) => (
                  <li key={f.path} className="aspect-square overflow-hidden bg-piedra">
                    <a href={f.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal de Storage */}
                      <img
                        src={f.url}
                        alt={`Trabajo ${i + 1} de ${p.nombre}`}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="datos-t">
            <h2 id="datos-t" className="etiqueta m-0 mb-4 text-tabaco">
              Datos
            </h2>
            <dl className="m-0 border-t border-obsidiana">
              {datos.map(([k, v]) => (
                <div key={k} className={fila}>
                  <dt className="text-tabaco">{k}</dt>
                  <dd className="m-0">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="flex flex-col gap-12">
          <section aria-labelledby="req-t">
            <h2 id="req-t" className="etiqueta m-0 mb-4 text-tabaco">
              Requisitos
            </h2>
            <ul className="m-0 flex list-none flex-col border-t border-obsidiana p-0">
              {requisitos.map((r) => (
                <li key={r.id} className="flex items-start gap-3 border-b border-piedra py-2.5 text-[14px]">
                  <span aria-hidden="true" className={faltan.has(r.id) ? "text-huaca-profundo" : "text-obsidiana"}>
                    {faltan.has(r.id) ? "✕" : "✓"}
                  </span>
                  <span>
                    {r.titulo}
                    <span className="sr-only">{faltan.has(r.id) ? ": no cumple" : ": cumple"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="gestion-t">
            <h2 id="gestion-t" className="etiqueta m-0 mb-4 text-tabaco">
              Gestión
            </h2>
            <FormAccion accion={actualizarPostulacion} boton="Guardar" etiqueta="Estado de la postulación">
              <input type="hidden" name="id" value={p.id} />
              <CampoSeleccion tono="claro" etiqueta="Estado" name="estado" defaultValue={p.estado} id="estado">
                {(Object.keys(ESTADOS_POSTULACION) as EstadoPostulacion[]).map((e) => (
                  <option key={e} value={e}>
                    {ESTADOS_POSTULACION[e]}
                  </option>
                ))}
              </CampoSeleccion>
              <CampoTexto
                tono="claro"
                etiqueta="Notas internas"
                name="notas"
                rows={5}
                defaultValue={p.notas ?? ""}
                id="notas"
              />
            </FormAccion>
          </section>

          {p.estado === "aprobada" && (
            <section aria-labelledby="ficha-t">
              <h2 id="ficha-t" className="etiqueta m-0 mb-4 text-tabaco">
                Ficha de barbero
              </h2>
              {p.barbero_id ? (
                <p className="m-0 text-[15px] leading-[1.6]">
                  Ya tiene ficha.{" "}
                  <Link href="/admin/barberos" className="underline underline-offset-4">
                    Completar en Barberos y horarios
                  </Link>
                </p>
              ) : (
                <FormAccion
                  accion={crearBarberoDesdePostulacion}
                  boton="Crear ficha de barbero"
                  etiqueta="Crear ficha de barbero"
                >
                  <input type="hidden" name="id" value={p.id} />
                  <p className="m-0 text-[14px] leading-[1.55] text-tabaco">
                    Copia nombre, años de oficio, especialidad y WhatsApp. La ficha queda sin recibir solicitudes hasta
                    que le pongas foto y horario.
                  </p>
                </FormAccion>
              )}
            </section>
          )}

          <section aria-labelledby="borrar-t">
            <h2 id="borrar-t" className="etiqueta m-0 mb-4 text-tabaco">
              Borrar
            </h2>
            <FormAccion accion={borrarPostulacion} boton="Borrar postulación y fotos" etiqueta="Borrar postulación">
              <input type="hidden" name="id" value={p.id} />
              <p className="m-0 text-[14px] leading-[1.55] text-tabaco">
                Si el postulante pide que borremos sus datos, o al terminar el plazo de conservación. No se puede
                deshacer.
              </p>
              <Campo
                tono="claro"
                etiqueta="Escribe BORRAR para confirmar"
                name="confirmar"
                autoComplete="off"
                id="confirmar"
              />
            </FormAccion>
          </section>
        </aside>
      </div>
    </>
  );
}
