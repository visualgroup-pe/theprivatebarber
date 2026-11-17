import type { MetadataRoute } from "next";
import { SITIO_URL } from "@/lib/sitio";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: Array<[string, number, MetadataRoute.Sitemap[number]["changeFrequency"]]> = [
    ["/", 1, "weekly"],
    ["/reserva", 0.9, "weekly"],
    ["/resenas", 0.7, "monthly"],
    ["/convocatoria", 0.5, "monthly"],
    ["/terminos", 0.3, "yearly"],
    ["/privacidad", 0.3, "yearly"],
    ["/libro-de-reclamaciones", 0.3, "yearly"],
  ];
  return paginas.map(([ruta, priority, changeFrequency]) => ({
    url: `${SITIO_URL}${ruta === "/" ? "" : ruta}`,
    changeFrequency,
    priority,
  }));
}
