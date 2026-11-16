/**
 * Carta de servicios (semilla de la tabla `servicios`, BRIEF · Carta).
 * En la etapa 4 la portada pasa a leerlos de Supabase; estos datos quedan
 * como semilla y respaldo. Textos copiados del lienzo.
 */
export type Servicio = {
  /** uuid en Supabase; en el respaldo de content/, el slug */
  id: string;
  slug: string;
  nombre: string;
  precioPen: number;
  duracionMin: number | null;
  duracionMax: number | null;
  esAdicional: boolean;
  /** Descripción de la carta (portada) */
  descripcion: string;
  /** Descripción corta (pantallas móviles de reserva) */
  descripcionCorta: string;
  /** Texto de la columna de duración en la carta */
  duracionTexto: string;
};

export const servicios: Servicio[] = [
  {
    id: "corte-a-medida",
    slug: "corte-a-medida",
    nombre: "Corte a medida",
    precioPen: 200,
    duracionMin: 45,
    duracionMax: 60,
    esAdicional: false,
    descripcion: "Conversación previa, corte, lavado y peinado.",
    descripcionCorta: "Conversación, corte, lavado y peinado",
    duracionTexto: "45 min – 1 h",
  },
  {
    id: "barba-y-perfilado",
    slug: "barba-y-perfilado",
    nombre: "Barba y perfilado",
    precioPen: 100,
    duracionMin: 45,
    duracionMax: 60,
    esAdicional: false,
    descripcion: "Diseño de la línea, toalla caliente y navaja.",
    descripcionCorta: "Línea, toalla caliente y navaja",
    duracionTexto: "45 min – 1 h",
  },
  {
    id: "corte-y-barba",
    slug: "corte-y-barba",
    nombre: "Corte y barba",
    precioPen: 300,
    duracionMin: 45,
    duracionMax: 60,
    esAdicional: false,
    descripcion: "El servicio completo, pensado como un conjunto.",
    descripcionCorta: "El servicio completo",
    duracionTexto: "45 min – 1 h",
  },
  {
    id: "asesoria-de-imagen",
    slug: "asesoria-de-imagen",
    nombre: "Asesoría de imagen",
    precioPen: 50,
    duracionMin: null,
    duracionMax: null,
    esAdicional: true,
    descripcion: "Un plan personal de imagen que el barbero te propone y explica durante la atención.",
    descripcionCorta: "Un plan personal que el barbero te propone durante la atención",
    duracionTexto: "Se suma a tu cita",
  },
];

export const serviciosPrincipales = servicios.filter((s) => !s.esAdicional);
export const asesoria = servicios.find((s) => s.esAdicional)!;
