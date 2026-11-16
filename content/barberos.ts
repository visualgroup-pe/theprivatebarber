/**
 * Barberos y horarios (semilla y respaldo sin Supabase). Datos del brief y del lienzo.
 * Pendientes: especialidad de Nilber; nombre, foto y especialidad del segundo barbero.
 */
export type Horario = { diaSemana: number; horaInicio: string; horaFin: string };

export type Barbero = {
  id: string;
  slug: string;
  nombre: string;
  fotoUrl: string | null;
  anosOficio: number | null;
  especialidad: string | null;
  /** ISO 8601: 1 = lunes … 7 = domingo */
  horarios: Horario[];
};

const nueveANueve = (dias: number[]): Horario[] =>
  dias.map((d) => ({ diaSemana: d, horaInicio: "09:00", horaFin: "21:00" }));

export const barberos: Barbero[] = [
  {
    id: "nilber",
    slug: "nilber",
    nombre: "Nilber",
    fotoUrl: "/img/nilber.jpg",
    anosOficio: 5,
    especialidad: null,
    horarios: nueveANueve([4]),
  },
  {
    id: "segundo-barbero",
    slug: "segundo-barbero",
    nombre: "[Nombre]",
    fotoUrl: null,
    anosOficio: 5,
    especialidad: null,
    horarios: nueveANueve([1, 2, 3, 4, 5, 6]),
  },
];
