/** Zonas de atención (semilla de la tabla `zonas`). */
export const zonas = ["San Isidro", "Miraflores", "Santiago de Surco", "San Borja", "La Molina"] as const;

/** Opción que crea la solicitud marcada para revisión de zona. */
export const OTRO_DISTRITO = "Otro distrito";

/** Franjas horarias (BRIEF · Franjas). El barbero fija la hora exacta al aceptar. */
export const franjas = [
  { id: "manana", nombre: "Mañana", inicio: 9, fin: 12 },
  { id: "mediodia", nombre: "Mediodía", inicio: 12, fin: 15 },
  { id: "tarde", nombre: "Tarde", inicio: 15, fin: 18 },
  { id: "noche", nombre: "Noche", inicio: 18, fin: 21 },
] as const;

export type FranjaId = (typeof franjas)[number]["id"];
