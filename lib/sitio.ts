/** URL pública del sitio (dominio de producción por defecto). */
export const SITIO_URL = (process.env.NEXT_PUBLIC_SITIO_URL || "https://www.theprivatebarber.pro").replace(/\/$/, "");

export const NOMBRE = "The Private Barber";
export const DESCRIPCION =
  "Barbería privada a domicilio en Lima. Corte, barba y asesoría de imagen en tu casa, tu oficina o tu hotel, en San Isidro, Miraflores, Surco, San Borja y La Molina.";

/**
 * Open Graph completo para una página. En Next.js el openGraph de una página
 * reemplaza al del layout (no se combina), así que cada una lo pide entero.
 */
export function openGraphDe(ruta: string) {
  return {
    type: "website" as const,
    locale: "es_PE",
    siteName: NOMBRE,
    url: ruta,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "The Private Barber: un sillón junto a ventanales con árboles" }],
  };
}
