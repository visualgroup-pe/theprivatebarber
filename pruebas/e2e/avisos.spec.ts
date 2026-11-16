import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  correos,
  cuentas,
  esperarAvisos,
  hayBaseDeDatos,
  ids,
  PREFIJO,
  plantilla,
  servicio,
  solicitudValida,
  vaciarAvisos,
} from "./datos";

/** Avisos por WhatsApp y correo (Resend y Meta imitados en el puerto 3999). */
test.skip(!hayBaseDeDatos(), "Necesita Supabase (.env.local)");

const parametros = (p: { json: Record<string, any> }) =>
  (p.json.template.components[0].parameters as { text: string }[]).map((x) => x.text);

test("solicitud nueva: avisa al cliente (WhatsApp y correo) y al barbero en menos de 1 minuto", async ({ request }) => {
  await vaciarAvisos();
  const id = await ids();
  const t0 = Date.now();
  const { resumen } = await (await request.post("/api/solicitudes", { data: solicitudValida(id, { whatsapp: "900000120" }) })).json();
  const l = await esperarAvisos((l) => l.length >= 3);
  expect(Math.max(...l.map((p) => p.t)) - t0).toBeLessThan(60_000);

  const [cliente] = plantilla(l, "tpb_solicitud_recibida");
  expect(cliente.json.to).toBe("51900000120");
  expect(parametros(cliente)).toEqual([PREFIJO.split(" ")[0], "Corte y barba + asesoría", expect.stringMatching(/tarde \(15–18\)$/), "San Isidro", `${PREFIJO} Barbero`]);
  const [barbero] = plantilla(l, "tpb_barbero_nueva_solicitud");
  expect(barbero.json.to).toBe("51911111112");
  expect(parametros(barbero)[3]).toMatch(new RegExp(`/barbero/cita/${resumen.id}$`));
  const [correo] = correos(l, "Recibimos tu solicitud");
  expect(correo.json.to).toEqual(["cliente.e2e@example.com"]);
  expect(correo.json.html).toContain("aún no está confirmada");
  // El cliente no recibe confirmación hasta que el barbero acepta.
  expect(plantilla(l, "tpb_cita_confirmada")).toHaveLength(0);

  // Cada aviso se registra justo después de enviarse.
  await expect
    .poll(async () => (await servicio().from("avisos").select("estado").eq("cita_id", resumen.id)).data?.map((a) => a.estado))
    .toEqual(["enviado", "enviado", "enviado"]);
});

test("al aceptar el barbero, el cliente recibe la confirmación con la hora", async ({ page, request }) => {
  const id = await ids();
  const { resumen } = await (await request.post("/api/solicitudes", { data: solicitudValida(id, { whatsapp: "900000121" }) })).json();
  await page.goto("/ingresar");
  await page.fill('input[name="correo"]', cuentas().barbero.email);
  await page.fill('input[name="clave"]', cuentas().barbero.clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL("**/barbero");
  await vaciarAvisos();
  await page.goto(`/barbero/cita/${resumen.id}`);
  const aceptar = page.locator("details", { hasText: "Aceptar" }).first();
  await aceptar.locator('select[name="hora"]').selectOption("16:00");
  await aceptar.locator('button[type="submit"]').click();
  const l = await esperarAvisos((l) => plantilla(l, "tpb_cita_confirmada").length > 0 && correos(l, "Tu cita está confirmada").length > 0);
  expect(parametros(plantilla(l, "tpb_cita_confirmada")[0])).toEqual(expect.arrayContaining(["16:00", "S/ 350"]));
});

test("la tarea de cada hora exige su secreto", async ({ request }) => {
  expect((await request.get("/api/cron/avisos")).status()).toBe(401);
  expect((await request.get("/api/cron/avisos", { headers: { authorization: "Bearer otro" } })).status()).toBe(401);
});

test("tarea de cada hora: recordatorio 24 h antes y alerta por falta de respuesta, sin repetir", async ({ request }) => {
  // Con AVISO_SIN_RESPUESTA_HORAS=0 la alerta tocaría solicitudes reales pendientes: solo se prueba si no hay.
  const { data: barbero } = await servicio().from("barberos").select("id").eq("slug", "prueba-e2e").single();
  const { count: reales } = await servicio()
    .from("citas")
    .select("id", { count: "exact", head: true })
    .in("estado", ["solicitud_recibida", "pendiente", "confirmada"])
    .is("alerta_admin_enviada_en", null)
    .neq("barbero_id", barbero!.id);
  test.skip((reales ?? 0) > 0, "Hay citas reales abiertas: la tarea las tocaría. Correr contra un proyecto de prueba.");

  const id = await ids();
  // Cita confirmada que empieza en ~24 h (el barbero de prueba atiende todos los días de 9 a 21).
  const en24 = new Date(Date.now() + 24 * 3600e3 - 5 * 3600e3);
  const h = en24.getUTCHours();
  const recordable = h >= 9 && h < 21;
  if (recordable) {
    const franja = h < 12 ? "manana" : h < 15 ? "mediodia" : h < 18 ? "tarde" : "noche";
    const r = await (
      await request.post("/api/solicitudes", {
        data: solicitudValida(id, { fecha: en24.toISOString().slice(0, 10), franja, whatsapp: "900000122", conAsesoria: false }),
      })
    ).json();
    const hora = `${String(h).padStart(2, "0")}:${String(Math.floor(en24.getUTCMinutes() / 15) * 15).padStart(2, "0")}`;
    await servicio().rpc("cambiar_estado_cita", { p_cita: r.resumen.id, p_estado: "confirmada", p_hora: hora }).throwOnError();
  }
  await request.post("/api/solicitudes", { data: solicitudValida(id, { whatsapp: "900000123" }) });
  await new Promise((r) => setTimeout(r, 1500));
  await vaciarAvisos();

  const cron = () => request.get("/api/cron/avisos", { headers: { authorization: "Bearer secreto-cron" } }).then((r) => r.json());
  const primera = await cron();
  const l = await esperarAvisos((l) => plantilla(l, "tpb_admin_sin_respuesta").length > 0);
  expect(primera.alertas).toBeGreaterThanOrEqual(1);
  expect(plantilla(l, "tpb_admin_sin_respuesta")[0].json.to).toBe("51911111111");
  expect(correos(l, "Solicitud sin respuesta").some((c) => c.json.to[0] === "admin.e2e@example.com")).toBe(true);
  if (recordable) {
    expect(primera.recordatorios).toBe(1);
    expect(plantilla(l, "tpb_recordatorio")).toHaveLength(1);
  }
  const segunda = await cron();
  expect(segunda).toEqual({ recordatorios: 0, alertas: 0 });
});

test("webhook de WhatsApp: verificación de Meta, firma y estado «leído»", async ({ request }) => {
  const ok = await request.get("/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verif-prueba&hub.challenge=12345");
  expect(await ok.text()).toBe("12345");
  expect((await request.get("/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=mal&hub.challenge=1")).status()).toBe(403);

  const { data: aviso } = await servicio().from("avisos").select("proveedor_id").eq("canal", "whatsapp").not("proveedor_id", "is", null).limit(1).single();
  const cuerpo = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: aviso!.proveedor_id, status: "read" }] } }] }] });
  expect((await request.post("/api/whatsapp/webhook", { data: cuerpo, headers: { "x-hub-signature-256": "sha256=falsa" } })).status()).toBe(401);
  const firma = `sha256=${createHmac("sha256", "secreto-app").update(cuerpo).digest("hex")}`;
  expect((await request.post("/api/whatsapp/webhook", { data: cuerpo, headers: { "x-hub-signature-256": firma, "content-type": "application/json" } })).status()).toBe(200);
  const { data: leido } = await servicio().from("avisos").select("estado").eq("proveedor_id", aviso!.proveedor_id).single();
  expect(leido!.estado).toBe("leido");
});

test("Libro de Reclamaciones: correlativo, copia al consumidor y aviso a la administración", async ({ page }) => {
  await vaciarAvisos();
  await page.goto("/libro-de-reclamaciones");
  await page.fill('[name="nombre"]', `${PREFIJO} Reclamo`);
  await page.fill('[name="numeroDocumento"]', "12345678");
  await page.fill('[name="domicilio"]', "Av. de prueba 1");
  await page.fill('[name="telefono"]', "900000124");
  await page.fill('[name="correo"]', "reclamo.e2e@example.com");
  await page.fill('[name="descripcionBien"]', "Prueba <script>");
  await page.check('[name="tipo"][value="reclamo"]', { force: true });
  await page.fill('[name="detalle"]', "Detalle con <b>etiquetas</b>.");
  await page.fill('[name="pedido"]', "Ninguno.");
  await page.getByRole("button", { name: /Enviar hoja/ }).click();
  await expect(page.locator("[role=status]")).toContainText(/N\.° \d{4}-\d{4}/);
  const l = await esperarAvisos((l) => correos(l, "Copia de tu hoja").length > 0 && correos(l, "Nueva hoja").length > 0);
  const [copia] = correos(l, "Copia de tu hoja");
  expect(copia.json.to).toEqual(["reclamo.e2e@example.com"]);
  expect(copia.json.html).toContain("INDECOPI");
  expect(copia.json.html).not.toContain("<b>etiquetas</b>");
  expect(correos(l, "Nueva hoja")[0].json.to).toEqual(["admin.e2e@example.com"]);
});
