import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { avisos } from "@/lib/avisos/config";
import { crearClienteServicio, servidorConfigurado } from "@/lib/supabase/admin";

/**
 * Webhook de WhatsApp Cloud API.
 * GET: verificación al suscribir el webhook en Meta (hub.challenge).
 * POST: estados de entrega de los mensajes enviados (entregado, leído, fallido),
 * que actualizan la tabla avisos. La firma se comprueba con el secreto de la app.
 */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const token = avisos.whatsapp.tokenVerificacion;
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Prohibido", { status: 403 });
}

function firmaValida(cuerpo: string, firma: string | null): boolean {
  const secreto = avisos.whatsapp.secretoApp;
  if (!secreto || !firma?.startsWith("sha256=")) return false;
  const esperada = Buffer.from(createHmac("sha256", secreto).update(cuerpo).digest("hex"));
  const recibida = Buffer.from(firma.slice(7));
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

const ESTADOS: Record<string, "enviado" | "entregado" | "leido" | "fallido"> = {
  sent: "enviado",
  delivered: "entregado",
  read: "leido",
  failed: "fallido",
};

type Notificacion = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: Array<{ id: string; status: string; errors?: Array<{ title?: string; message?: string }> }>;
      };
    }>;
  }>;
};

export async function POST(request: Request) {
  const cuerpo = await request.text();
  if (!firmaValida(cuerpo, request.headers.get("x-hub-signature-256"))) {
    return new Response("Firma inválida", { status: 401 });
  }
  let datos: Notificacion;
  try {
    datos = JSON.parse(cuerpo) as Notificacion;
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }
  if (!servidorConfigurado()) return NextResponse.json({ ok: true });

  const s = crearClienteServicio();
  const estados = (datos.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.statuses ?? []));
  for (const st of estados) {
    const estado = ESTADOS[st.status];
    if (!estado) continue;
    const error = st.errors?.map((e) => e.message ?? e.title).join("; ") || null;
    await s
      .from("avisos")
      .update({ estado, error, actualizado_en: new Date().toISOString() })
      .eq("proveedor_id", st.id)
      .eq("canal", "whatsapp");
  }
  // Los mensajes que escriben los clientes se atienden en la app de WhatsApp Business.
  return NextResponse.json({ ok: true });
}
