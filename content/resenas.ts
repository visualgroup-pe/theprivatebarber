/**
 * Reseñas de Google Maps, copiadas tal como las escribieron (sin editar).
 * Pendiente (BRIEF): confirmar de qué perfil de Google son y su enlace.
 */
export type Resena = {
  autor: string;
  texto: string;
  hace: string;
  /** Detalle del perfil del autor en Google Maps (página de reseñas) */
  perfil: string;
};

export const resenas: Resena[] = [
  {
    autor: "Victor P.",
    texto: "Excelente servicio y precio. Muy recomendado.",
    hace: "hace 1 año",
    perfil: "Local Guide, 24 opiniones · 6 fotos",
  },
  {
    autor: "Jorge S.",
    texto: "Buena atención y servicio.",
    hace: "hace 4 años",
    perfil: "Local Guide, 37 opiniones · 13 fotos",
  },
  {
    autor: "Juan A.",
    texto: "Buena atencion...buen trabajo...recomendable",
    hace: "hace 7 años",
    perfil: "Local Guide, 175 opiniones · 616 fotos",
  },
];

/** Marcadores del lienzo hasta confirmar el perfil de Google. */
export const perfilGoogle = {
  calificacion: "[Calificación]",
  total: "[N]",
  enlace: "[enlace-perfil-google]",
};
