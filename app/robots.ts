import type { MetadataRoute } from "next";
import { SITIO_URL } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Paneles, API y la confirmación (datos de una solicitud) no se indexan.
      disallow: ["/admin", "/barbero", "/ingresar", "/api/", "/reserva/confirmacion", "/ui"],
    },
    sitemap: `${SITIO_URL}/sitemap.xml`,
    host: SITIO_URL,
  };
}
