import { notFound } from "next/navigation";
import { DetalleCita } from "@/components/panel/DetalleCita";
import { exigirRol } from "@/lib/auth";
import { obtenerCita } from "@/lib/citas";

export default async function PaginaCitaAdmin({ params }: PageProps<"/admin/citas/[id]">) {
  await exigirRol("admin");
  const { id } = await params;
  const datos = await obtenerCita(id);
  if (!datos) notFound();
  return <DetalleCita cita={datos.cita} eventos={datos.eventos} rol="admin" volver="/admin/citas" />;
}
