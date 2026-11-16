import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";
import type { Database } from "./tipos";

const CLAVE_SECRETA = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function servidorConfigurado(): boolean {
  return Boolean(SUPABASE_URL && CLAVE_SECRETA);
}

/**
 * Cliente con la clave secreta (rol service_role, ignora RLS).
 * Solo en el servidor: /api/solicitudes, Libro de Reclamaciones y avisos.
 * Nunca se importa desde un componente de cliente (server-only lo impide).
 */
export function crearClienteServicio() {
  if (!servidorConfigurado()) {
    throw new Error("Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY.");
  }
  return createClient<Database>(SUPABASE_URL, CLAVE_SECRETA, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
