import { expect, test } from "@playwright/test";
import { barberos } from "@/content/barberos";
import { franjasDisponibles, horaMasTemprana } from "@/lib/disponibilidad";

/** Regla de horarios: sin anticipación mínima de días; hoy, hasta una hora antes. */
const segundo = barberos.find((b) => b.slug === "segundo-barbero")!; // lunes a sábado, 9–21
const lunes = "2026-11-23";
const a = (hora: string) => ({ fecha: lunes, minutos: Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3)) });

test("hoy: solo franjas en las que cabe una visita a una hora o más de ahora", () => {
  expect(franjasDisponibles(segundo, lunes, a("07:00"))).toEqual(["manana", "mediodia", "tarde", "noche"]);
  // 14:20 → la primera hora posible es 15:30: la tarde todavía sirve
  expect(horaMasTemprana(a("14:20"))).toBe(15 * 60 + 30);
  expect(franjasDisponibles(segundo, lunes, a("14:20"))).toEqual(["tarde", "noche"]);
  // 17:10 → 18:15: la tarde (hasta las 18) ya no
  expect(franjasDisponibles(segundo, lunes, a("17:10"))).toEqual(["noche"]);
  // 20:01 → 21:15: ya no hay franjas hoy
  expect(franjasDisponibles(segundo, lunes, a("20:01"))).toEqual([]);
});

test("mañana y los días siguientes: todas las franjas del horario del barbero", () => {
  expect(franjasDisponibles(segundo, "2026-11-24", a("20:30"))).toEqual(["manana", "mediodia", "tarde", "noche"]);
  // domingo: el segundo barbero no atiende
  expect(franjasDisponibles(segundo, "2026-11-29", a("08:00"))).toEqual([]);
});
