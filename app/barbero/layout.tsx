import type { Metadata } from "next";
import { MarcoPanel } from "@/components/panel/MarcoPanel";
import { exigirRol } from "@/lib/auth";

// El panel lee la sesión en cada pedido: no tiene versión estática.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Panel del barbero", template: "%s · Panel del barbero" },
  robots: { index: false, follow: false },
};

export default async function LayoutBarbero({ children }: LayoutProps<"/barbero">) {
  const usuario = await exigirRol("barber");
  return (
    <MarcoPanel titulo="Panel del barbero" inicio="/barbero" usuario={usuario}>
      {children}
    </MarcoPanel>
  );
}
