import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Capa de acceso a la sesión (Data Access Layer): toda página y acción del
 * panel pasa por aquí. El rol sale de la tabla perfiles; sin fila, sin acceso.
 * Las políticas RLS de Supabase vuelven a comprobarlo en cada consulta.
 */
export type Rol = "admin" | "barber";
export type Usuario = {
  id: string;
  email: string;
  rol: Rol | null;
  nombre: string;
  /** Solo para barberos: su fila en la tabla barberos. */
  barberoId: string | null;
};

export const obtenerUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: perfil } = await supabase.from("perfiles").select("rol, nombre").eq("id", claims.sub).maybeSingle();
  let barberoId: string | null = null;
  if (perfil?.rol === "barber") {
    const { data: barbero } = await supabase.from("barberos").select("id").eq("user_id", claims.sub).maybeSingle();
    barberoId = barbero?.id ?? null;
  }
  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    rol: perfil?.rol ?? null,
    nombre: perfil?.nombre ?? "",
    barberoId,
  };
});

export function inicioDe(rol: Rol | null): string {
  return rol === "admin" ? "/admin" : rol === "barber" ? "/barbero" : "/ingresar?error=sin-acceso";
}

/** Exige sesión y rol; si no, redirige al ingreso o al panel que le corresponde. */
export async function exigirRol(rol: Rol): Promise<Usuario> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/ingresar");
  if (usuario.rol !== rol) redirect(inicioDe(usuario.rol));
  return usuario;
}
