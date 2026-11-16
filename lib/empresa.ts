/**
 * Datos legales del proveedor. Pendientes (BRIEF · Contenido pendiente):
 * mientras falten se muestran los marcadores entre corchetes.
 */
export const empresa = {
  marca: "The Private Barber",
  razonSocial: process.env.NEXT_PUBLIC_RAZON_SOCIAL || "[Razón social]",
  ruc: process.env.NEXT_PUBLIC_RUC || "[pendiente]",
  domicilio: process.env.NEXT_PUBLIC_DOMICILIO_FISCAL || "[Domicilio fiscal]",
  /** Código de inscripción del banco de datos ante la ANPD */
  codigoAnpd: process.env.NEXT_PUBLIC_ANPD_CODIGO || "[código de inscripción]",
  /** Fecha de la última revisión de los textos legales */
  actualizacion: process.env.NEXT_PUBLIC_LEGAL_ACTUALIZACION || "[fecha]",
};
