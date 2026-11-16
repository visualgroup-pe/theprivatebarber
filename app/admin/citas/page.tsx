import Link from "next/link";
import { ListaCitas } from "@/components/panel/Citas";
import { TituloPanel } from "@/components/panel/MarcoPanel";
import { Boton } from "@/components/ui/Boton";
import { exigirRol } from "@/lib/auth";
import { listarCitas } from "@/lib/citas";
import { ESTADOS, ESTADOS_ABIERTOS, type EstadoCita } from "@/lib/estados";
import { cn } from "@/lib/cn";

export const metadata = { title: "Citas" };

const FILTROS: Array<{ id: string; nombre: string; estados?: EstadoCita[] }> = [
  { id: "abiertas", nombre: "Abiertas", estados: ESTADOS_ABIERTOS },
  ...(Object.keys(ESTADOS) as EstadoCita[]).map((e) => ({ id: e, nombre: ESTADOS[e].nombre, estados: [e] })),
  { id: "todas", nombre: "Todas" },
];

export default async function PaginaCitas({ searchParams }: PageProps<"/admin/citas">) {
  await exigirRol("admin");
  const { estado } = await searchParams;
  const filtro = FILTROS.find((f) => f.id === estado) ?? FILTROS[0];
  const citas = await listarCitas({ estados: filtro.estados, recientes: filtro.id === "todas" });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <TituloPanel etiqueta="Citas">{filtro.nombre}</TituloPanel>
        <Boton href="/admin/citas/nueva" pequena className="mb-10">
          Registrar solicitud de WhatsApp
        </Boton>
      </div>
      <nav aria-label="Filtrar por estado" className="mb-8 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.id}
            href={`/admin/citas?estado=${f.id}`}
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
      <ListaCitas citas={citas} base="/admin/citas" vacio="No hay citas con este filtro." mostrarBarbero />
    </>
  );
}
