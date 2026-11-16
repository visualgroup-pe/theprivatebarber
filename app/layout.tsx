import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { variablesDeFuente } from "@/lib/fuentes";
import { DESCRIPCION, NOMBRE, openGraphDe, SITIO_URL } from "@/lib/sitio";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: {
    default: "The Private Barber · Barbería privada a domicilio en Lima",
    template: "%s · The Private Barber",
  },
  description: DESCRIPCION,
  applicationName: NOMBRE,
  openGraph: openGraphDe("/"),
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#EEE9E1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={variablesDeFuente}>
      <body>
        {children}
        {/* Vercel Analytics: medición agregada y sin cookies */}
        <Analytics />
      </body>
    </html>
  );
}
