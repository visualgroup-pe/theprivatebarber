import { devices } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Ayudas de las pruebas E2E. Escriben en el proyecto de Supabase configurado
 * (.env.local): todo lo que crean lleva el prefijo «Prueba E2E» y se borra en
 * limpiar.ts. Nunca modifican a los barberos reales.
 */
export const PREFIJO = "Prueba E2E";
export const BARBERO_PRUEBA = "prueba-e2e";
export const MOCK = "http://localhost:3999";
export const CUENTAS = join(__dirname, "..", ".cuentas.json");

export const hayBaseDeDatos = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

let cliente: SupabaseClient | null = null;
export function servicio(): SupabaseClient {
  cliente ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

export type Cuenta = { email: string; clave: string; id: string };
export const cuentas = (): { admin: Cuenta; barbero: Cuenta } => JSON.parse(readFileSync(CUENTAS, "utf8"));

export async function ids() {
  const s = servicio();
  const [{ data: b }, { data: sv }, { data: z }] = await Promise.all([
    s.from("barberos").select("id, slug"),
    s.from("servicios").select("id, slug"),
    s.from("zonas").select("id, distrito"),
  ]);
  const de = <T extends Record<string, string>>(a: T[] | null, k: keyof T, v: string) => a!.find((x) => x[k] === v)!.id as string;
  return {
    nilber: de(b, "slug", "nilber"),
    prueba: de(b, "slug", BARBERO_PRUEBA),
    corte: de(sv, "slug", "corte-a-medida"),
    corteBarba: de(sv, "slug", "corte-y-barba"),
    asesoria: de(sv, "slug", "asesoria-de-imagen"),
    sanIsidro: de(z, "distrito", "San Isidro"),
    miraflores: de(z, "distrito", "Miraflores"),
  };
}

/** Próximo día de la semana (ISO 1 = lunes … 7 = domingo), al menos mañana, en hora de Lima. */
export function proximo(isodow: number): string {
  const hoy = new Date(Date.now() - 5 * 3600e3);
  const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  const actual = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + (((isodow - actual + 7) % 7) || 7));
  return d.toISOString().slice(0, 10);
}

/** Datos válidos de una solicitud para /api/solicitudes. */
export function solicitudValida(id: Awaited<ReturnType<typeof ids>>, extra: Record<string, unknown> = {}) {
  return {
    servicioId: id.corteBarba,
    conAsesoria: true,
    barberoId: id.prueba,
    fecha: proximo(2),
    franja: "tarde",
    lugar: "casa",
    zonaId: id.sanIsidro,
    direccion: "Calle de prueba 123",
    nombre: `${PREFIJO} Cliente`,
    whatsapp: "900000101",
    correo: "cliente.e2e@example.com",
    consentimientoDatos: true,
    consentimientoMarketing: false,
    ...extra,
  };
}

/** Pedidos que recibió el servidor de prueba de Resend y WhatsApp. */
export type Pedido = { t: number; url: string; auth?: string; idem?: string; json: Record<string, any> };
export const leerAvisos = async (): Promise<Pedido[]> => (await fetch(`${MOCK}/__log`)).json();
export const vaciarAvisos = () => fetch(`${MOCK}/__reset`);
export async function esperarAvisos(cond: (l: Pedido[]) => boolean, ms = 15_000): Promise<Pedido[]> {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const l = await leerAvisos();
    if (cond(l)) return l;
    await new Promise((r) => setTimeout(r, 300));
  }
  return leerAvisos();
}
export const plantilla = (l: Pedido[], nombre: string) => l.filter((p) => p.json?.template?.name === nombre);
export const correos = (l: Pedido[], asunto: string) => l.filter((p) => p.url === "/emails" && p.json.subject.startsWith(asunto));

/** iPhone 13 (tamaño, toque y densidad) en Chromium: el perfil trae WebKit por defecto. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { defaultBrowserType: _webkit, ...iphone } = devices["iPhone 13"];
export const MOVIL = iphone;
