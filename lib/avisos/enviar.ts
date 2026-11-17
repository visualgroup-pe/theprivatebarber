import "server-only";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";
import { avisos, correoActivo, whatsappActivo } from "./config";

export type Resultado = { estado: "enviado" | "omitido" | "fallido"; proveedorId?: string; error?: string };

/** WhatsApp Cloud API: mensaje de plantilla aprobada por Meta. `para` = 9 dígitos peruanos. */
export async function enviarWhatsapp(para: string, plantilla: string, parametros: string[]): Promise<Resultado> {
  if (!whatsappActivo()) return { estado: "omitido", error: "WhatsApp sin configurar" };
  const { url, version, numeroId, token, idioma } = avisos.whatsapp;
  try {
    const r = await fetch(`${url}/${version}/${numeroId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `51${para}`,
        type: "template",
        template: {
          name: plantilla,
          language: { code: idioma },
          components: [
            {
              type: "body",
              // WhatsApp no acepta parámetros vacíos ni saltos de línea.
              parameters: parametros.map((t) => ({ type: "text", text: t.replace(/\s+/g, " ").trim() || "—" })),
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const cuerpo = (await r.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
    if (!r.ok) return { estado: "fallido", error: cuerpo.error?.message ?? `HTTP ${r.status}` };
    return { estado: "enviado", proveedorId: cuerpo.messages?.[0]?.id };
  } catch (e) {
    return { estado: "fallido", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Resend: correo con el diseño de marca. */
export async function enviarCorreo(para: string, asunto: string, html: string, texto: string, clave?: string): Promise<Resultado> {
  if (!correoActivo()) return { estado: "omitido", error: "Correo sin configurar" };
  const { url, clave: api, remitente, responderA } = avisos.correo;
  try {
    const r = await fetch(`${url}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${api}`,
        "Content-Type": "application/json",
        // Evita duplicados si el mismo aviso se reintenta.
        ...(clave ? { "Idempotency-Key": clave } : {}),
      },
      body: JSON.stringify({ from: remitente, to: [para], subject: asunto, html, text: texto, reply_to: responderA }),
      signal: AbortSignal.timeout(10_000),
    });
    const cuerpo = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok) return { estado: "fallido", error: cuerpo.message ?? `HTTP ${r.status}` };
    return { estado: "enviado", proveedorId: cuerpo.id };
  } catch (e) {
    return { estado: "fallido", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Deja constancia del aviso en la tabla avisos (solo la administración la lee). */
export async function registrar(
  datos: { citaId?: string; reclamacionId?: string; postulacionId?: string; canal: "whatsapp" | "correo"; destinatario: string; plantilla: string },
  r: Resultado,
) {
  if (r.estado === "fallido") console.error(`Aviso ${datos.plantilla} por ${datos.canal} falló:`, r.error);
  if (!servidorConfigurado()) return;
  await crearClienteServicio()
    .from("avisos")
    .insert({
      cita_id: datos.citaId ?? null,
      reclamacion_id: datos.reclamacionId ?? null,
      postulacion_id: datos.postulacionId ?? null,
      canal: datos.canal,
      destinatario: datos.destinatario,
      plantilla: datos.plantilla,
      estado: r.estado,
      proveedor_id: r.proveedorId ?? null,
      error: r.error ?? null,
    })
    .then(({ error }) => error && console.error("No se pudo registrar el aviso:", error.message));
}
