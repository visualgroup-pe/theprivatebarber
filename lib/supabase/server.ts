import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from "./config";
import type { Database } from "./tipos";

/**
 * Cliente con la sesión del usuario (cookies): paneles del barbero y de
 * administración. Las políticas RLS deciden qué ve cada uno.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // Llamado desde un Server Component: el proxy refresca la sesión.
        }
      },
    },
  });
}

/**
 * Cliente público sin sesión (rol anon) para el catálogo de la web:
 * servicios, zonas, barberos y horarios activos. Se puede usar en 'use cache'.
 */
export function crearClientePublico() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
