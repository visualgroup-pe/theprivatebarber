"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { inicioDe, type Rol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoIngreso = { error?: string; correo?: string };

const esquema = z.object({
  correo: z.email({ error: "Escribe tu correo." }),
  clave: z.string().min(1, "Escribe tu contraseña."),
  siguiente: z.string().optional(),
});

/** Solo se vuelve a rutas internas del panel (evita redirecciones abiertas). */
function destinoSeguro(siguiente: string | undefined, rol: Rol | null): string {
  const base = inicioDe(rol);
  if (siguiente && /^\/(barbero|admin)(\/[\w\-/]*)?$/.test(siguiente) && siguiente.startsWith(base)) return siguiente;
  return base;
}

export async function ingresar(_previo: EstadoIngreso, fd: FormData): Promise<EstadoIngreso> {
  const datos = esquema.safeParse({
    correo: fd.get("correo"),
    clave: fd.get("clave"),
    siguiente: fd.get("siguiente") ?? undefined,
  });
  const correo = String(fd.get("correo") ?? "");
  if (!datos.success) return { error: datos.error.issues[0].message, correo };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: datos.data.correo,
    password: datos.data.clave,
  });
  if (error || !data.user) return { error: "Correo o contraseña incorrectos.", correo };

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", data.user.id).maybeSingle();
  if (!perfil) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no tiene acceso al panel. Pide a la administración que te dé un rol.", correo };
  }
  redirect(destinoSeguro(datos.data.siguiente, perfil.rol));
}

export async function salir() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
