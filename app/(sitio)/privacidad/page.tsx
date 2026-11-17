import type { Metadata } from "next";
import { openGraphDe } from "@/lib/sitio";
import Link from "next/link";
import { PaginaLegal, type SeccionLegal } from "@/components/bloques/PaginaLegal";
import { correoVisible, enlaceCorreo } from "@/lib/contacto";
import { empresa } from "@/lib/empresa";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidad" },
  openGraph: openGraphDe("/privacidad"),
  title: "Política de privacidad",
  description:
    "Cómo The Private Barber trata tus datos personales conforme a la Ley N.° 29733, Ley de Protección de Datos Personales.",
};

/*
 * Borrador basado en la Ley N.° 29733 y su Reglamento. Debe revisarlo un
 * abogado antes de publicar. Los [marcadores] son datos pendientes.
 */
const secciones: SeccionLegal[] = [
  {
    id: "responsable",
    titulo: "Quién es responsable de tus datos",
    contenido: (
      <>
        <p>
          El titular del banco de datos y responsable del tratamiento es <strong>{empresa.razonSocial}</strong>, con RUC{" "}
          {empresa.ruc} y domicilio en {empresa.domicilio}, que opera la marca The Private Barber (en adelante, «nosotros»).
        </p>
        <p>
          Para cualquier consulta sobre tus datos personales puedes escribirnos a{" "}
          <a href={enlaceCorreo}>{correoVisible}</a>.
        </p>
      </>
    ),
  },
  {
    id: "datos",
    titulo: "Qué datos recogemos",
    contenido: (
      <>
        <p>Solo pedimos los datos necesarios para atenderte:</p>
        <ul>
          <li>
            <strong>Al solicitar una cita:</strong> tu nombre, tu número de WhatsApp, tu correo si nos lo das, el distrito,
            la dirección y referencia del lugar de atención, el servicio elegido, la fecha y la franja horaria.
          </li>
          <li>
            <strong>Durante la atención:</strong> si contratas la asesoría de imagen, el barbero puede guardar notas sobre tu
            corte y tus preferencias en tu ficha personal, para no repetir explicaciones la próxima vez.
          </li>
          <li>
            <strong>Al registrar un reclamo o una queja:</strong> los datos del formulario del Libro de Reclamaciones
            (nombre, documento de identidad, domicilio, teléfono, correo y el detalle de lo ocurrido).
          </li>
          <li>
            <strong>Al postular como barbero:</strong> los datos del formulario de la convocatoria (nombre, documento de
            identidad, WhatsApp, correo si nos lo das, distrito, experiencia, disponibilidad y las fotos de tus trabajos).
          </li>
          <li>
            <strong>Al navegar la web:</strong> datos técnicos y de uso agregados, como se explica en el apartado de
            cookies.
          </li>
        </ul>
        <p>No pedimos datos sensibles.</p>
      </>
    ),
  },
  {
    id: "finalidades",
    titulo: "Para qué los usamos",
    contenido: (
      <>
        <ul>
          <li>Recibir y gestionar tu solicitud de cita y asignarla a un barbero.</li>
          <li>Coordinar la visita: hora exacta, acceso al edificio y quién te recibe.</li>
          <li>
            Avisarte por WhatsApp y correo de cada cambio en tu cita: solicitud recibida, cita confirmada, nuevo horario
            propuesto, cita rechazada y recordatorio 24 horas antes.
          </li>
          <li>Atender tus reclamos, quejas y el ejercicio de tus derechos.</li>
          <li id="postulantes">
            Si postulas como barbero: evaluar tu postulación, contactarte para la entrevista y la prueba de oficio y, si te
            unes al equipo, crear tu ficha. Solo la ve la administración, y las fotos se guardan en un almacenamiento
            privado.
          </li>
          <li>Cumplir obligaciones legales, tributarias y contables.</li>
        </ul>
        <p>
          <strong>Comunicaciones comerciales.</strong> Solo te enviaremos novedades y promociones si marcas la casilla de
          consentimiento para marketing, que es separada y opcional. No marcarla no afecta tu cita, y puedes retirar ese
          consentimiento cuando quieras.
        </p>
      </>
    ),
  },
  {
    id: "base",
    titulo: "Con qué base los tratamos",
    contenido: (
      <p>
        Tratamos tus datos con tu consentimiento, que nos das al marcar la casilla de aceptación al enviar la solicitud, y
        para cumplir la relación de servicio que tú mismo solicitas. Los datos del Libro de Reclamaciones se tratan para
        cumplir el Código de Protección y Defensa del Consumidor. El consentimiento para marketing es independiente.
      </p>
    ),
  },
  {
    id: "destinatarios",
    titulo: "Con quién los compartimos",
    contenido: (
      <>
        <p>
          No vendemos ni cedemos tus datos. Solo los ve el barbero asignado a tu cita y el equipo que la administra. Para
          operar la web usamos proveedores que tratan los datos por encargo nuestro y bajo nuestras instrucciones:
        </p>
        <ul>
          <li>Vercel, para el alojamiento de la web.</li>
          <li>Supabase, para la base de datos y el acceso del equipo.</li>
          <li>Meta Platforms (WhatsApp Business), para los avisos por WhatsApp.</li>
          <li>Resend, para los avisos por correo.</li>
        </ul>
        <p>
          Algunos de estos proveedores tienen sus servidores fuera del Perú, por lo que puede haber un flujo
          transfronterizo de datos. Solo trabajamos con proveedores que ofrecen niveles de protección adecuados, conforme a
          la Ley N.° 29733.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    titulo: "Cookies y medición",
    contenido: (
      <>
        <p>
          Usamos Vercel Analytics para medir de forma agregada cómo se usa la web, sin identificarte. Si en el futuro
          usamos el píxel de Meta para medir reservas, solo se activará si lo aceptas en el aviso de cookies, y podrás
          cambiar tu decisión en cualquier momento.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    titulo: "Cuánto tiempo los guardamos",
    contenido: (
      <p>
        Conservamos los datos de tus citas mientras seas cliente y durante [plazo de conservación] después de tu última
        cita. Las postulaciones de barberos que no prosperan se conservan durante [plazo de conservación de
        postulaciones] y luego se borran con sus fotos; puedes pedir que las borremos antes. Los reclamos se conservan el tiempo que exige la normativa del Libro de Reclamaciones, y la información
        tributaria, el que exigen las normas tributarias. Después los eliminamos o los anonimizamos.
      </p>
    ),
  },
  {
    id: "derechos",
    titulo: "Tus derechos",
    contenido: (
      <>
        <p>
          Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, cancelación y oposición, así como
          revocar tu consentimiento. Escríbenos a <a href={enlaceCorreo}>{correoVisible}</a> indicando qué derecho quieres
          ejercer y adjunta una copia de tu documento de identidad. Te responderemos dentro de los plazos que fija la ley.
        </p>
        <p>
          Si consideras que no atendimos tu pedido, puedes acudir a la Autoridad Nacional de Protección de Datos Personales
          del Ministerio de Justicia y Derechos Humanos.
        </p>
      </>
    ),
  },
  {
    id: "banco",
    titulo: "Banco de datos",
    contenido: (
      <p>
        Tus datos se almacenan en el banco de datos «Clientes» de {empresa.razonSocial}, inscrito en el Registro Nacional
        de Protección de Datos Personales con el código {empresa.codigoAnpd}.
      </p>
    ),
  },
  {
    id: "seguridad",
    titulo: "Seguridad",
    contenido: (
      <p>
        Aplicamos medidas técnicas y organizativas para proteger tus datos: conexiones cifradas, acceso restringido según
        el rol de cada persona del equipo (un barbero solo ve sus citas) y registro de cada cambio en el estado de una
        cita.
      </p>
    ),
  },
  {
    id: "cambios",
    titulo: "Cambios en esta política",
    contenido: (
      <p>
        Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha. Si el cambio es importante,
        te lo avisaremos. Consulta también los <Link href="/terminos">términos y condiciones</Link>.
      </p>
    ),
  },
];

export default function PaginaPrivacidad() {
  return (
    <PaginaLegal
      etiqueta="Legal"
      etiquetaDerecha={`Actualizada: ${empresa.actualizacion}`}
      titulo={
        <>
          Política de
          <br />
          <em className="text-huaca">privacidad.</em>
        </>
      }
      entradilla={
        <p className="m-0">
          Tus datos sirven para una cosa: atenderte bien. Aquí explicamos cuáles pedimos, para qué y cómo puedes
          controlarlos, conforme a la Ley N.° 29733, Ley de Protección de Datos Personales.
        </p>
      }
      secciones={secciones}
    />
  );
}
