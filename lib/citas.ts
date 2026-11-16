import "server-only";
import type { EstadoCita } from "@/lib/estados";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";

/**
 * Consultas de citas para los paneles, siempre con la sesión del usuario:
 * las políticas RLS hacen que un barbero solo reciba sus citas.
 */
const CAMPOS = `
  id, estado, fecha, franja, hora_confirmada, con_asesoria, precio_servicio_pen, precio_asesoria_pen, precio_total_pen,
  lugar, direccion, referencia, revision_zona, distrito_otro, motivo, propuesta_fecha, propuesta_franja, propuesta_hora,
  origen, creado_en, actualizado_en,
  servicio:servicios (nombre),
  zona:zonas (distrito),
  barbero:barberos (id, nombre),
  cliente:clientes (nombre, whatsapp, correo)
`;

type Fila = Database["public"]["Tables"]["citas"]["Row"];
export type Cita = Pick<
  Fila,
  | "id"
  | "estado"
  | "fecha"
  | "franja"
  | "hora_confirmada"
  | "con_asesoria"
  | "precio_servicio_pen"
  | "precio_asesoria_pen"
  | "precio_total_pen"
  | "lugar"
  | "direccion"
  | "referencia"
  | "revision_zona"
  | "distrito_otro"
  | "motivo"
  | "propuesta_fecha"
  | "propuesta_franja"
  | "propuesta_hora"
  | "origen"
  | "creado_en"
  | "actualizado_en"
> & {
  servicio: { nombre: string } | null;
  zona: { distrito: string } | null;
  barbero: { id: string; nombre: string } | null;
  cliente: { nombre: string; whatsapp: string; correo: string | null } | null;
};

export type EventoCita = Database["public"]["Tables"]["cita_eventos"]["Row"];

export function distritoDe(c: Pick<Cita, "zona" | "distrito_otro">): string {
  return c.zona?.distrito ?? c.distrito_otro ?? "—";
}

type Filtro = { estados?: EstadoCita[]; desde?: string; hasta?: string; barberoId?: string; limite?: number; recientes?: boolean };

export async function listarCitas(filtro: Filtro = {}): Promise<Cita[]> {
  const supabase = await crearClienteServidor();
  let q = supabase.from("citas").select(CAMPOS);
  if (filtro.estados?.length) q = q.in("estado", filtro.estados);
  if (filtro.desde) q = q.gte("fecha", filtro.desde);
  if (filtro.hasta) q = q.lte("fecha", filtro.hasta);
  if (filtro.barberoId) q = q.eq("barbero_id", filtro.barberoId);
  q = filtro.recientes
    ? q.order("actualizado_en", { ascending: false })
    : q.order("fecha").order("franja").order("creado_en");
  const { data, error } = await q.limit(filtro.limite ?? 200);
  if (error) throw new Error(`No se pudieron leer las citas: ${error.message}`);
  return data as unknown as Cita[];
}

export async function obtenerCita(id: string): Promise<{ cita: Cita; eventos: EventoCita[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const [{ data: cita }, { data: eventos }] = await Promise.all([
    supabase.from("citas").select(CAMPOS).eq("id", id).maybeSingle(),
    supabase.from("cita_eventos").select("*").eq("cita_id", id).order("creado_en"),
  ]);
  if (!cita) return null;
  return { cita: cita as unknown as Cita, eventos: eventos ?? [] };
}
