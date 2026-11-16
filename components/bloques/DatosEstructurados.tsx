import { obtenerServicios, obtenerZonas } from "@/lib/catalogo";
import { DESCRIPCION, NOMBRE, SITIO_URL } from "@/lib/sitio";

const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO?.replace(/\D/g, "");

/**
 * Datos estructurados (schema.org) para SEO local: HairSalon sin local a la
 * calle (servicio a domicilio), con los distritos que atiende, el horario y
 * la carta con precios en soles. No incluye calificaciones: están pendientes.
 */
export async function DatosEstructurados() {
  const [servicios, zonas] = await Promise.all([obtenerServicios(), obtenerZonas()]);
  const precios = servicios.filter((s) => !s.esAdicional).map((s) => s.precioPen);
  const datos = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${SITIO_URL}/#negocio`,
    name: NOMBRE,
    slogan: "Precisión en privado.",
    description: DESCRIPCION,
    url: SITIO_URL,
    image: `${SITIO_URL}/og.jpg`,
    logo: `${SITIO_URL}/marca/logo-correo.png`,
    ...(numero ? { telephone: `+51${numero}` } : {}),
    priceRange: precios.length ? `S/ ${Math.min(...precios)} – S/ ${Math.max(...precios)}` : undefined,
    currenciesAccepted: "PEN",
    paymentAccepted: "Tarjeta de crédito o débito, Yape, Plin, transferencia bancaria, efectivo",
    address: { "@type": "PostalAddress", addressLocality: "Lima", addressRegion: "Lima", addressCountry: "PE" },
    areaServed: zonas.map((z) => ({ "@type": "AdministrativeArea", name: `${z.distrito}, Lima` })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "21:00",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "La carta",
      itemListElement: servicios.map((s) => ({
        "@type": "Offer",
        price: s.precioPen,
        priceCurrency: "PEN",
        itemOffered: { "@type": "Service", name: s.nombre, description: s.descripcion },
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      // JSON con «<» escapado para que no pueda cerrar la etiqueta (recomendación de Next.js).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}
