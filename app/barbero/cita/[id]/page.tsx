import { notFound } from "next/navigation";
import { DetalleCita } from "@/components/panel/DetalleCita";
import { exigirRol } from "@/lib/auth";
import { obtenerCita } from "@/lib/citas";

export default async function PaginaCitaBarbero({ params }: PageProps<"/barbero/cita/[id]">) {
  await exigirRol("barber");
  const { id } = await params;
  // RLS: si la cita no es de este barbero, no llega.
  const datos = await obtenerCita(id);
  if (!datos) notFound();
  return <DetalleCita cita={datos.cita} eventos={datos.eventos} rol="barber" volver="/barbero" />;
}
