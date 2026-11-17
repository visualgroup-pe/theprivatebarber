/**
 * Convocatoria de barberos (/convocatoria). Requisitos para el estándar del
 * servicio: se derivan de lo que la web promete en «La visita» y en las
 * preguntas frecuentes. Los umbrales viven aquí para cambiarlos en un lugar;
 * la evaluación automática está en lib/convocatoria.ts.
 * Los [marcadores] son datos pendientes de la empresa.
 */

/** Años de oficio mínimos para cumplir el requisito de experiencia. */
export const ANOS_MINIMOS = 3;
/** Fotos de trabajos: mínimo para cumplir sin Instagram, y máximo por postulación. */
export const FOTOS_MINIMAS = 3;
export const FOTOS_MAXIMAS = 6;

export type RequisitoId = "oficio" | "tecnica" | "trabajos" | "maletin" | "higiene" | "trato" | "zonas";

export const requisitos: Array<{
  id: RequisitoId;
  titulo: string;
  texto: string;
}> = [
  {
    id: "oficio",
    titulo: `${ANOS_MINIMOS} años de oficio o más`,
    texto: "Como barbero profesional, en barbería o con clientela propia.",
  },
  {
    id: "tecnica",
    titulo: "Tijera, máquina y navaja",
    texto: "Corte a tijera y a máquina, y barba completa: perfilado a navaja con toalla caliente.",
  },
  {
    id: "trabajos",
    titulo: "Trabajos que lo muestren",
    texto: `Al menos ${FOTOS_MINIMAS} fotos de tus cortes o tu Instagram profesional.`,
  },
  {
    id: "maletin",
    titulo: "Maletín propio",
    texto: "Tus herramientas, capa, toallas y lo necesario para proteger el espacio y dejarlo limpio.",
  },
  {
    id: "higiene",
    titulo: "Higiene en cada visita",
    texto: "Herramientas limpias y desinfectadas entre un cliente y otro.",
  },
  {
    id: "trato",
    titulo: "Puntualidad y discreción",
    texto: "Llegar a tiempo a casas, oficinas y hoteles, y tratar cada espacio con cuidado.",
  },
  {
    id: "zonas",
    titulo: "Atender nuestras zonas",
    texto: "Disponibilidad para atender en al menos uno de nuestros distritos.",
  },
];

/** Suman, pero no son requisito. */
export const valoramos = [
  "Experiencia en barberías de alto nivel, hoteles o atención a domicilio.",
  "Criterio para recomendar un corte según el rostro y el estilo de cada cliente.",
  "Inglés básico, para huéspedes de hotel.",
];

export const proceso = [
  {
    titulo: "Postulas",
    texto: "Completas este formulario con tus datos, tus trabajos y tu disponibilidad.",
  },
  {
    titulo: "Revisamos",
    texto: "Vemos tu perfil y tus fotos. Si encaja, te escribimos por WhatsApp en [plazo de respuesta].",
  },
  {
    titulo: "Conversamos",
    texto: "Una entrevista para conocerte y contarte cómo trabajamos.",
  },
  {
    titulo: "Prueba de oficio",
    texto: "Un servicio completo con un modelo, como en una visita real.",
  },
];

export const ofrecemos = "[Condiciones: modalidad de trabajo, pago por servicio y horarios]";

export const TECNICAS = [
  { id: "tijera", nombre: "Corte a tijera" },
  { id: "maquina", nombre: "Corte a máquina" },
  { id: "navaja", nombre: "Perfilado a navaja" },
  { id: "toalla_caliente", nombre: "Barba con toalla caliente" },
] as const;
export type TecnicaId = (typeof TECNICAS)[number]["id"];

export const MOVILIDAD = [
  { id: "auto", nombre: "Auto propio" },
  { id: "moto", nombre: "Moto propia" },
  { id: "transporte", nombre: "Taxi o transporte público" },
] as const;
export type MovilidadId = (typeof MOVILIDAD)[number]["id"];

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export const ESTADOS_POSTULACION = {
  nueva: "Nueva",
  en_revision: "En revisión",
  entrevista: "Entrevista",
  prueba: "Prueba de oficio",
  aprobada: "Aprobada",
  descartada: "Descartada",
} as const;
export type EstadoPostulacion = keyof typeof ESTADOS_POSTULACION;
