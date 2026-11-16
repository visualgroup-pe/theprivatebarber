import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from "./config";
import type { Database } from "./tipos";

/** Cliente para componentes de cliente (paneles). Usa la sesión del navegador. */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA);
}
