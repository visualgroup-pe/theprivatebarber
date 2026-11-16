"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { obtenerUsuario } from "@/lib/auth";
import { avisarCita } from "@/lib/avisos";
import { mensajeDeError } from "@/lib/estados";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";

export type ResultadoAccion = { ok: boolean; mensaje: string } | null;

type Args = Database["public"]["Functions"]["cambiar_estado_cita"]["Args"];

const ESTADOS = ["pendiente", "confirmada", "rechazada", "reprogramacion", "cancelada", "completada"] as const;
const vacio = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

const esquema = z.object({
  id: z.uuid(),
  estado: z.enum(ESTADOS),
  nota: z.string().max(500).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  propuestaFecha: z.iso.date().optional(),
  propuestaFranja: z.enum(["manana", "mediodia", "tarde", "noche"]).optional(),
  propuestaHora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

const LISTO: Record<(typeof ESTADOS)[number], string> = {
  pendiente: "Marcada en revisión.",
  confirmada: "Cita confirmada.",
  rechazada: "Solicitud rechazada.",
  reprogramacion: "Propuesta enviada.",
  cancelada: "Cita cancelada.",
  completada: "Cita completada.",
};

/**
 * Cambia el estado de una cita (aceptar, rechazar, proponer, completar, cancelar).
 * Corre con la sesión del usuario: RLS y los triggers deciden si puede hacerlo
 * y lo anotan en cita_eventos con su nombre.
 */
export async function cambiarEstado(_previo: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const usuario = await obtenerUsuario();
  if (!usuario?.rol) return { ok: false, mensaje: "Tu sesión terminó. Vuelve a ingresar." };

  const datos = esquema.safeParse({
    id: fd.get("id"),
    estado: fd.get("estado"),
    nota: vacio(fd.get("nota")),
    hora: vacio(fd.get("hora")),
    propuestaFecha: vacio(fd.get("propuestaFecha")),
    propuestaFranja: vacio(fd.get("propuestaFranja")),
    propuestaHora: vacio(fd.get("propuestaHora")),
  });
  if (!datos.success) return { ok: false, mensaje: "Revisa los datos del formulario." };
  const d = datos.data;

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cambiar_estado_cita", {
    p_cita: d.id,
    p_estado: d.estado,
    p_nota: d.nota ?? null,
    p_hora: d.hora ?? null,
    p_propuesta_fecha: d.propuestaFecha ?? null,
    p_propuesta_franja: d.propuestaFranja ?? null,
    p_propuesta_hora: d.propuestaHora ?? null,
  } as unknown as Args);
  if (error) return { ok: false, mensaje: mensajeDeError(error.message) };

  // El cliente recibe el aviso del nuevo estado (completada no se avisa).
  const estado = d.estado;
  if (estado === "confirmada" || estado === "reprogramacion" || estado === "rechazada" || estado === "cancelada") {
    after(() => avisarCita(d.id, estado));
  }
  revalidatePath("/barbero", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, mensaje: LISTO[d.estado] };
}

/** «El barbero revisa»: al abrir una solicitud nueva pasa a «en revisión». */
export async function marcarEnRevision(id: string): Promise<void> {
  const usuario = await obtenerUsuario();
  if (usuario?.rol !== "barber" || !z.uuid().safeParse(id).success) return;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("citas").select("estado").eq("id", id).maybeSingle();
  if (data?.estado !== "solicitud_recibida") return;
  await supabase.rpc("cambiar_estado_cita", { p_cita: id, p_estado: "pendiente", p_nota: "El barbero abrió la solicitud." } as unknown as Args);
  revalidatePath("/barbero", "layout");
  revalidatePath("/admin", "layout");
}
