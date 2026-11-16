/**
 * Datos de contacto. Mientras falten (BRIEF · Contenido pendiente) se
 * muestran los marcadores del lienzo y los enlaces llevan a #reserva.
 */
const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO?.replace(/\D/g, "") || "";
const instagram = process.env.NEXT_PUBLIC_INSTAGRAM?.replace(/^@/, "") || "";
const correo = process.env.NEXT_PUBLIC_CORREO || "";

export const MENSAJE_WHATSAPP = "Hola, quisiera solicitar una cita con The Private Barber.";

/** https://wa.me/51<número>?text=<mensaje> (o #reserva si falta el número). */
export function enlaceWhatsApp(texto: string = MENSAJE_WHATSAPP, respaldo = "/#reserva"): string {
  if (!numero) return respaldo;
  return `https://wa.me/51${numero}?text=${encodeURIComponent(texto)}`;
}

/** «987 654 321» o el marcador del lienzo. */
export const whatsappVisible = numero ? numero.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : "[número]";
export const instagramVisible = instagram ? `@${instagram}` : "@[cuenta]";
export const enlaceInstagram = instagram ? `https://www.instagram.com/${instagram}/` : "/#reserva";
export const correoVisible = correo || "[correo]@[dominio]";
export const enlaceCorreo = correo ? `mailto:${correo}` : "/#reserva";
