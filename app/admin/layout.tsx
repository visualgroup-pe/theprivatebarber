import type { Metadata } from "next";
import { MarcoPanel } from "@/components/panel/MarcoPanel";
import { exigirRol } from "@/lib/auth";

// El panel lee la sesión en cada pedido: no tiene versión estática.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración" },
  robots: { index: false, follow: false },
};

const ENLACES = [
  { href: "/admin", texto: "Inicio" },
  { href: "/admin/citas", texto: "Citas" },
  { href: "/admin/servicios", texto: "Servicios y precios" },
  { href: "/admin/barberos", texto: "Barberos y horarios" },
  { href: "/admin/zonas", texto: "Zonas" },
  { href: "/admin/reclamaciones", texto: "Reclamaciones" },
];

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const usuario = await exigirRol("admin");
  return (
    <MarcoPanel titulo="Administración" inicio="/admin" enlaces={ENLACES} usuario={usuario}>
      {children}
    </MarcoPanel>
  );
}
