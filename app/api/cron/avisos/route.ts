import { NextResponse } from "next/server";
import { avisarCita } from "@/lib/avisos";
import { avisos } from "@/lib/avisos/config";
import { ahoraEnLima, sumarDias } from "@/lib/disponibilidad";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";

/**
 * Tarea de cada hora (Vercel Cron, vercel.json):
 * · recordatorio al cliente ~24 h antes de una cita confirmada;
 * · alerta a la administración si el barbero no respondió en N horas.
 * Las marcas en la cita evitan repetir avisos.
 */
export async function GET(request: Request) {
  const autorizacion = request.headers.get("authorization");
  if (!avisos.secretoCron || autorizacion !== `Bearer ${avisos.secretoCron}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!servidorConfigurado()) return NextResponse.json({ error: "Supabase sin configurar" }, { status: 503 });

  const s = crearClienteServicio();
  const ahora = new Date();
  const hoy = ahoraEnLima(ahora).fecha;

  // Recordatorios: citas confirmadas que empiezan dentro de 22 a 25 horas.
  const { data: confirmadas, error: e1 } = await s
    .from("citas")
    .select("id, fecha, hora_confirmada")
    .eq("estado", "confirmada")
    .is("recordatorio_enviado_en", null)
    .gte("fecha", hoy)
    .lte("fecha", sumarDias(hoy, 2));
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  const porRecordar = (confirmadas ?? []).filter((c) => {
    if (!c.hora_confirmada) return false;
    const inicio = Date.parse(`${c.fecha}T${c.hora_confirmada.slice(0, 5)}:00-05:00`);
    const horas = (inicio - ahora.getTime()) / 3_600_000;
    return horas > 22 && horas <= 25;
  });

  // Alertas: solicitudes sin respuesta del barbero hace más de N horas.
  const limite = new Date(ahora.getTime() - avisos.horasSinRespuesta * 3_600_000).toISOString();
  const { data: sinRespuesta, error: e2 } = await s
    .from("citas")
    .select("id")
    .in("estado", ["solicitud_recibida", "pendiente"])
    .is("alerta_admin_enviada_en", null)
    .lt("creado_en", limite);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  for (const c of porRecordar) await avisarCita(c.id, "recordatorio");
  for (const c of sinRespuesta ?? []) await avisarCita(c.id, "alerta_admin");

  return NextResponse.json({ recordatorios: porRecordar.length, alertas: sinRespuesta?.length ?? 0 });
}
