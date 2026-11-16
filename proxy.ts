import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

/**
 * Refresca la sesión de Supabase en cada visita a los paneles y manda al
 * ingreso a quien no tiene sesión. El rol se comprueba en cada página
 * (lib/auth.ts) y, en los datos, con las políticas RLS.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  if (!supabaseConfigurado()) return respuesta;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
      },
    },
  });

  // getClaims valida el JWT (y lo renueva si hace falta) en cada pedido.
  const { data } = await supabase.auth.getClaims();
  const ruta = request.nextUrl.pathname;
  const esPanel = ruta.startsWith("/barbero") || ruta.startsWith("/admin");

  if (esPanel && !data?.claims?.sub) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/ingresar";
    destino.search = `?siguiente=${encodeURIComponent(ruta)}`;
    const redireccion = NextResponse.redirect(destino);
    for (const c of respuesta.cookies.getAll()) redireccion.cookies.set(c);
    return redireccion;
  }
  return respuesta;
}

export const config = {
  matcher: ["/barbero/:path*", "/admin/:path*", "/ingresar"],
};
