import type { Metadata } from "next";
import { openGraphDe } from "@/lib/sitio";
import Link from "next/link";
import { PaginaLegal, type SeccionLegal } from "@/components/bloques/PaginaLegal";
import { POLITICA_CANCELACION } from "@/content/politicas";
import { obtenerServicios, obtenerZonas } from "@/lib/catalogo";
import { correoVisible, enlaceCorreo } from "@/lib/contacto";
import { empresa } from "@/lib/empresa";
import { soles } from "@/lib/tokens";

export const metadata: Metadata = {
  alternates: { canonical: "/terminos" },
  openGraph: openGraphDe("/terminos"),
  title: "Términos y condiciones",
  description:
    "Condiciones del servicio de barbería a domicilio de The Private Barber: reservas, precios, pagos, reprogramación y cancelación.",
};

/*
 * Borrador. Debe revisarlo un abogado antes de publicar.
 * La política de reprogramación y cancelación vive en content/politicas.ts.
 */
async function seccionesTerminos(): Promise<SeccionLegal[]> {
  const [servicios, zonasActivas] = await Promise.all([obtenerServicios(), obtenerZonas()]);
  const serviciosPrincipales = servicios.filter((s) => !s.esAdicional);
  const asesoria = servicios.find((s) => s.esAdicional);
  const zonas = zonasActivas.map((z) => z.distrito);
  const listaZonas =
    zonas.length > 1 ? `${zonas.slice(0, -1).join(", ")} y ${zonas[zonas.length - 1]}` : zonas.join("");

  return [
    {
      id: "proveedor",
      titulo: "Quiénes somos",
      contenido: (
        <p>
          The Private Barber es una marca de {empresa.razonSocial}, con RUC {empresa.ruc} y domicilio en{" "}
          {empresa.domicilio}, Lima, Perú. Puedes escribirnos a <a href={enlaceCorreo}>{correoVisible}</a>. Al solicitar
          una cita aceptas estos términos.
        </p>
      ),
    },
    {
      id: "servicio",
      titulo: "El servicio",
      contenido: (
        <>
          <p>
            Somos una barbería privada a domicilio: llevamos el servicio a tu casa, tu oficina o tu hotel. Atendemos en{" "}
            {listaZonas}, de lunes a sábado, de 9:00 a 21:00, según el horario de cada barbero.
          </p>
          <p>
            Si estás en otro distrito, puedes enviarnos la solicitud igual: queda pendiente de revisión y te confirmamos
            si podemos llegar.
          </p>
        </>
      ),
    },
    {
      id: "reserva",
      titulo: "Cómo se reserva",
      contenido: (
        <>
          <ol>
            <li>
              Envías una solicitud desde la web o por WhatsApp con el servicio, el distrito, el día y una franja
              horaria.
              <strong> Una solicitud todavía no es una cita.</strong>
            </li>
            <li>
              El barbero la revisa y puede aceptarla, proponerte otro horario o rechazarla. Al aceptarla, fija la hora
              exacta dentro de la franja que elegiste.
            </li>
            <li>
              Tu cita queda confirmada solo cuando el barbero la acepta y te lo avisamos por WhatsApp o correo. Si te
              proponemos otro horario, la cita se confirma cuando lo aceptas.
            </li>
          </ol>
          <p>
            Puedes solicitar tu cita para hoy mismo hasta una hora antes: el formulario solo ofrece los días y franjas en
            que todavía hay tiempo de llegar.
          </p>
        </>
      ),
    },
    {
      id: "precios",
      titulo: "Precios y pagos",
      contenido: (
        <>
          <p>
            Los precios están en soles e incluyen el IGV. Se muestran antes de enviar la solicitud y se mantienen para
            tu cita aunque la carta cambie después.
          </p>
          <ul>
            {serviciosPrincipales.map((s) => (
              <li key={s.slug}>
                {s.nombre}: {soles(s.precioPen)}
              </li>
            ))}
            {asesoria && (
              <li>
                {asesoria.nombre}: {soles(asesoria.precioPen)}. Solo puede pedirse junto con uno de los servicios
                anteriores.
              </li>
            )}
          </ul>
          <p>
            Cada servicio dura entre 45 minutos y una hora, e incluye el traslado dentro de las zonas de atención y la
            limpieza del espacio al terminar.
          </p>
          <p>
            Puedes pagar con tarjeta de crédito o débito, Yape, Plin, transferencia bancaria o efectivo. Emitimos boleta
            o factura electrónica.
          </p>
        </>
      ),
    },
    {
      id: "cancelacion",
      titulo: "Reprogramación y cancelación",
      contenido: (
        <ul>
          {POLITICA_CANCELACION.map((p) => (
            <li key={p.titulo}>
              <strong>{p.titulo}.</strong> {p.texto}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "espacio",
      titulo: "El lugar de atención",
      contenido: (
        <>
          <p>
            Necesitamos un espacio con buena luz, una silla y un enchufe cerca. El barbero lleva sus herramientas, capa,
            toallas y lo necesario para dejar todo limpio. Las herramientas se desinfectan antes de cada visita.
          </p>
          <p>
            En oficinas y hoteles atendemos siempre que el espacio lo permita. Al reservar coordinamos el acceso, quién
            te recibe y cualquier indicación del edificio.
          </p>
        </>
      ),
    },
    {
      id: "reclamos",
      titulo: "Reclamos y quejas",
      contenido: (
        <p>
          Tienes a tu disposición nuestro <Link href="/libro-de-reclamaciones">Libro de Reclamaciones virtual</Link>,
          conforme al Código de Protección y Defensa del Consumidor. Respondemos cada reclamo o queja en un plazo no
          mayor a quince (15) días hábiles.
        </p>
      ),
    },
    {
      id: "datos",
      titulo: "Datos personales",
      contenido: (
        <p>
          Tratamos tus datos como explica nuestra <Link href="/privacidad">política de privacidad</Link>.
        </p>
      ),
    },
    {
      id: "ley",
      titulo: "Ley aplicable",
      contenido: (
        <p>
          Estos términos se rigen por las leyes del Perú, en particular por la Ley N.° 29571, Código de Protección y
          Defensa del Consumidor.
        </p>
      ),
    },
  ];
}

export default async function PaginaTerminos() {
  const secciones = await seccionesTerminos();
  return (
    <PaginaLegal
      etiqueta="Legal"
      etiquetaDerecha={`Actualizados: ${empresa.actualizacion}`}
      titulo={
        <>
          Términos y
          <br />
          <em className="text-huaca">condiciones.</em>
        </>
      }
      entradilla={
        <p className="m-0">
          Las reglas del servicio, en claro: cómo se confirma una cita, qué incluye el precio y qué pasa si necesitas
          cambiarla.
        </p>
      }
      secciones={secciones}
    />
  );
}
