import { NextResponse } from "next/server";
import { FOTOS_MAXIMAS } from "@/content/convocatoria";
import { BUCKET_POSTULACIONES } from "@/lib/convocatoria";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";

/**
 * Entrega una URL firmada para subir UNA foto de trabajos directo a Storage
 * (sin pasar por la función: el límite de cuerpo de Vercel es de 4,5 MB).
 * Las fotos de una postulación van a la carpeta <id>/; el id lo crea el
 * servidor en la primera foto y pasa a ser el id de la postulación.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function responder(cuerpo: object, status: number) {
  return NextResponse.json(cuerpo, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!servidorConfigurado()) return responder({ mensaje: "La subida de fotos todavía no está activa." }, 503);

  const cuerpo = (await request.json().catch(() => ({}))) as { id?: unknown };
  const id = typeof cuerpo.id === "string" && UUID.test(cuerpo.id) ? cuerpo.id : crypto.randomUUID();
  const s = crearClienteServicio();

  // Una postulación ya enviada no recibe más fotos.
  const { data: existente } = await s.from("postulaciones").select("id").eq("id", id).maybeSingle();
  if (existente) return responder({ mensaje: "Esta postulación ya fue enviada." }, 409);

  const almacen = s.storage.from(BUCKET_POSTULACIONES);
  const { data: archivos } = await almacen.list(id, { limit: 100 });
  // Margen para fotos quitadas antes de enviar; al enviar se borran las que sobran.
  if ((archivos?.length ?? 0) >= FOTOS_MAXIMAS * 2) {
    return responder({ mensaje: `Puedes subir hasta ${FOTOS_MAXIMAS} fotos.` }, 409);
  }

  const ruta = `${id}/${Date.now()}.jpg`;
  const { data, error } = await almacen.createSignedUploadUrl(ruta);
  if (error || !data) {
    console.error("No se pudo firmar la subida", error);
    return responder({ mensaje: "No pudimos preparar la subida. Inténtalo de nuevo." }, 500);
  }
  return responder({ id, ruta, token: data.token }, 200);
}
