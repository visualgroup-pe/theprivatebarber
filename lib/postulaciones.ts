import "server-only";
import { BUCKET_POSTULACIONES } from "@/lib/convocatoria";
import { crearClienteServicio } from "@/lib/supabase/admin";

const UN_DIA = 24 * 3_600_000;

/**
 * Fotos subidas en /convocatoria sin que la postulación se haya enviado:
 * pasado un día, se borran (no guardamos imágenes que nadie nos confió del todo).
 * La llama la tarea de cada hora.
 */
export async function borrarFotosHuerfanas(ahora = Date.now()): Promise<number> {
  const s = crearClienteServicio();
  const almacen = s.storage.from(BUCKET_POSTULACIONES);
  const { data: carpetas } = await almacen.list("", { limit: 100 });
  // En la raíz, las carpetas vienen sin id.
  const ids = (carpetas ?? []).filter((c) => c.id === null).map((c) => c.name);
  if (ids.length === 0) return 0;
  const { data: enviadas } = await s.from("postulaciones").select("id").in("id", ids);
  const vivas = new Set((enviadas ?? []).map((p) => p.id));

  let borradas = 0;
  for (const id of ids.filter((i) => !vivas.has(i))) {
    const { data: archivos } = await almacen.list(id, { limit: 100 });
    const lista = archivos ?? [];
    const viejas = lista.filter((a) => a.created_at && ahora - Date.parse(a.created_at) > UN_DIA);
    // Solo si toda la carpeta es vieja: alguien podría estar postulando ahora mismo.
    if (lista.length > 0 && viejas.length === lista.length) {
      await almacen.remove(lista.map((a) => `${id}/${a.name}`));
      borradas += lista.length;
    }
  }
  return borradas;
}
