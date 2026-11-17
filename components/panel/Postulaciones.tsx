import { ESTADOS_POSTULACION, type EstadoPostulacion } from "@/content/convocatoria";

export function ChipPostulacion({ estado }: { estado: EstadoPostulacion }) {
  const clase =
    estado === "aprobada"
      ? "border-obsidiana bg-obsidiana text-lino"
      : estado === "descartada"
        ? "border-piedra text-tabaco"
        : estado === "nueva"
          ? "border-huaca-profundo text-huaca-profundo"
          : "border-obsidiana text-obsidiana";
  return (
    <span
      className={`inline-flex min-h-6 items-center border px-2 text-[11px] font-medium tracking-[0.08em] uppercase ${clase}`}
    >
      {ESTADOS_POSTULACION[estado]}
    </span>
  );
}
