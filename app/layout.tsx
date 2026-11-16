import type { Metadata, Viewport } from "next";
import { variablesDeFuente } from "@/lib/fuentes";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Private Barber · Precisión en privado",
    template: "%s · The Private Barber",
  },
  description:
    "Barbería privada a domicilio en Lima. Corte, barba y asesoría de imagen en tu casa, tu oficina o tu hotel.",
};

export const viewport: Viewport = {
  themeColor: "#EEE9E1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={variablesDeFuente}>
      <body>{children}</body>
    </html>
  );
}
