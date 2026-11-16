/**
 * Configuración de Supabase desde variables de entorno.
 * Acepta los nombres nuevos (publishable / secret) y los clásicos (anon / service_role).
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_CLAVE_PUBLICA =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** ¿Hay un proyecto de Supabase conectado? Sin él, la web usa los datos de content/. */
export function supabaseConfigurado(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_CLAVE_PUBLICA);
}
