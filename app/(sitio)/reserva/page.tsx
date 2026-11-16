import type { Metadata } from "next";
import { openGraphDe } from "@/lib/sitio";
import { FlujoMovil } from "@/components/reserva/FlujoMovil";
import { obtenerBarberos, obtenerServicios, obtenerZonas } from "@/lib/catalogo";

export const metadata: Metadata = {
  alternates: { canonical: "/reserva" },
  openGraph: openGraphDe("/reserva"),
  title: "Reservar una cita",
  description: "Solicita tu cita de corte, barba o asesoría de imagen a domicilio en Lima, en tres pasos.",
};

/** Solicitud de cita en tres pasos (pantallas móviles del lienzo). */
export default async function PaginaReserva() {
  const [servicios, zonas, barberos] = await Promise.all([obtenerServicios(), obtenerZonas(), obtenerBarberos()]);
  return <FlujoMovil catalogo={{ servicios, zonas, barberos }} />;
}
