import type { Metadata } from "next";
import { Confirmacion } from "./Confirmacion";

export const metadata: Metadata = {
  title: "Recibimos tu solicitud",
  robots: { index: false, follow: false },
};

export default function PaginaConfirmacion() {
  return <Confirmacion />;
}
