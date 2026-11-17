import Link from "next/link";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { ChipPostulacion } from "@/components/panel/Postulaciones";
import type { EstadoPostulacion } from "@/content/convocatoria";
import { exigirRol } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { nombreRequisito } from "@/lib/convocatoria";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Convocatoria" };

const ABIERTOS: EstadoPostulacion[] = ["nueva", "en_revision", "entrevista", "prueba"];

const FILTROS: Array<{
  id: string;
  nombre: string;
  estados?: EstadoPostulacion[];
  cumple?: boolean;
}> = [
  {
    id: "cumplen",
    nombre: "Cumplen requisitos",
    estados: ABIERTOS,
    cumple: true,
  },
  { id: "no-cumplen", nombre: "No cumplen", estados: ABIERTOS, cumple: false },
  { id: "aprobada", nombre: "Aprobadas", estados: ["aprobada"] },
  { id: "descartada", nombre: "Descartadas", estados: ["descartada"] },
  { id: "todas", nombre: "Todas" },
];

/** Convocatoria: postulaciones recibidas, primero las que cumplen los requisitos. */
export default async function PaginaPostulaciones({ searchParams }: PageProps<"/admin/postulaciones">) {
  await exigirRol("admin");
  const { ver } = await searchParams;
  const filtro = FILTROS.find((f) => f.id === ver) ?? FILTROS[0];
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("postulaciones")
    .select("id, creado_en, nombre, anos_oficio, zonas, estado, cumple_requisitos, requisitos_faltantes, fotos")
    .order("creado_en", { ascending: false })
    .limit(200);
  if (filtro.estados) consulta = consulta.in("estado", filtro.estados);
  if (filtro.cumple !== undefined) consulta = consulta.eq("cumple_requisitos", filtro.cumple);
  const { data: postulaciones } = await consulta;
  const lista = postulaciones ?? [];

  return (
    <>
      <TituloPanel etiqueta="Convocatoria">{filtro.nombre}</TituloPanel>
      <p className="-mt-4 mb-8 max-w-[640px] text-[15px] leading-[1.6] text-tabaco">
        Postulaciones desde{" "}
        <a href="/convocatoria" className="underline underline-offset-4">
          /convocatoria
        </a>
        . «Cumple requisitos» se calcula con las respuestas del postulante: confírmalo en la entrevista y la prueba de
        oficio.
      </p>
      <nav aria-label="Filtrar postulaciones" className="mb-8 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={`/admin/postulaciones?ver=${f.id}`}
            aria-current={f.id === filtro.id ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center border px-3.5 text-[13px] no-underline",
              f.id === filtro.id ? "border-obsidiana bg-obsidiana text-lino" : "border-piedra hover:border-obsidiana",
            )}
          >
            {f.nombre}
          </Link>
        ))}
      </nav>
      {lista.length === 0 && (
        <p className="border-t border-piedra py-6 text-[15px] text-tabaco">No hay postulaciones con este filtro.</p>
      )}
      <ul className="m-0 flex list-none flex-col border-t border-obsidiana p-0">
        {lista.map((p) => (
          <li key={p.id} className="border-b border-piedra">
            <Link
              href={`/admin/postulaciones/${p.id}`}
              className="flex flex-col gap-2 py-5 no-underline hover:bg-piedra/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <span className="flex flex-col gap-1.5">
                <span className="flex flex-wrap items-center gap-3">
                  <span className="font-serif text-[26px] leading-none">{p.nombre}</span>
                  <ChipPostulacion estado={p.estado} />
                </span>
                <span className="text-[14px] text-tabaco">
                  {p.anos_oficio} años de oficio · {p.fotos.length} fotos · {p.zonas.join(", ") || "sin distritos"}
                </span>
                {!p.cumple_requisitos && (
                  <span className="text-[13px] text-huaca-profundo">
                    Le falta: {p.requisitos_faltantes.map(nombreRequisito).join(" · ")}
                  </span>
                )}
              </span>
              <span className="font-mono text-[13px] text-tabaco sm:text-right">
                {new Date(p.creado_en).toLocaleDateString("es-PE", {
                  timeZone: "America/Lima",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
