import { expect, test } from "@playwright/test";
import { hayBaseDeDatos, ids, MOVIL, PREFIJO, proximo, servicio, solicitudValida } from "./datos";

/** Solicitud de cita: reglas del brief en la API y los dos formularios. */
test.skip(!hayBaseDeDatos(), "Necesita Supabase (.env.local)");

test.describe("API /api/solicitudes", () => {
  test("rechaza datos vacíos o inválidos con errores por campo", async ({ request }) => {
    const r = await request.post("/api/solicitudes", { data: {} });
    expect(r.status()).toBe(400);
    const cuerpo = await r.json();
    expect(Object.keys(cuerpo.errores)).toEqual(expect.arrayContaining(["servicioId", "barberoId", "fecha", "franja", "zonaId", "nombre", "whatsapp"]));
  });

  test("no acepta un día sin horario del barbero (Nilber solo jueves)", async ({ request }) => {
    const id = await ids();
    const r = await request.post("/api/solicitudes", { data: solicitudValida(id, { barberoId: id.nilber, fecha: proximo(1) }) });
    expect(r.status()).toBe(409);
    expect((await r.json()).errores.fecha).toContain("Nilber atiende solo jueves");
  });

  test("la asesoría no se puede pedir sola", async ({ request }) => {
    const id = await ids();
    const r = await request.post("/api/solicitudes", { data: solicitudValida(id, { servicioId: id.asesoria }) });
    expect(r.status()).toBe(400);
  });

  test("sin consentimiento de datos no se crea", async ({ request }) => {
    const id = await ids();
    const r = await request.post("/api/solicitudes", { data: solicitudValida(id, { consentimientoDatos: false }) });
    expect((await r.json()).errores.consentimientoDatos).toBeTruthy();
  });

  test("la trampa para bots responde sin revelar el motivo y no crea nada", async ({ request }) => {
    const id = await ids();
    const r = await request.post("/api/solicitudes", { data: solicitudValida(id, { sitio: "http://spam", whatsapp: "900000199" }) });
    expect(r.status()).toBe(400);
    expect((await r.json()).errores).toBeUndefined();
    const { count } = await servicio().from("clientes").select("id", { count: "exact", head: true }).eq("whatsapp", "900000199");
    expect(count).toBe(0);
  });

  test("crea la cita en «solicitud recibida», sin hora y con el precio de la carta (+ S/ 50)", async ({ request }) => {
    const id = await ids();
    const r = await request.post("/api/solicitudes", { data: solicitudValida(id) });
    expect(r.status()).toBe(201);
    const { resumen } = await r.json();
    const { data: cita } = await servicio().from("citas").select("*").eq("id", resumen.id).single();
    expect(cita).toMatchObject({ estado: "solicitud_recibida", hora_confirmada: null, precio_total_pen: 350, con_asesoria: true });
    const { data: eventos } = await servicio().from("cita_eventos").select("estado_nuevo, actor").eq("cita_id", resumen.id);
    expect(eventos).toEqual([{ estado_nuevo: "solicitud_recibida", actor: "cliente" }]);
  });

  test("«otro distrito» queda marcado para revisión de zona", async ({ request }) => {
    const id = await ids();
    const r = await request.post("/api/solicitudes", {
      data: solicitudValida(id, { zonaId: "otro", distritoOtro: "Chorrillos", whatsapp: "900000102" }),
    });
    expect(r.status()).toBe(201);
    const { data: cita } = await servicio().from("citas").select("revision_zona, distrito_otro").eq("id", (await r.json()).resumen.id).single();
    expect(cita).toEqual({ revision_zona: true, distrito_otro: "Chorrillos" });
  });
});

test.describe("Móvil: /reserva en tres pasos", () => {
  test.use(MOVIL);

  test("servicio → barbero, día y franja → datos → confirmación", async ({ page }) => {
    await page.goto("/reserva");
    await expect(page.locator('input[name="conAsesoria"]')).toBeDisabled();
    await page.getByRole("button", { name: /Elegir día y hora/ }).click();
    await expect(page.getByText("Elige un servicio.")).toBeVisible();
    await page.locator("label.opcion", { hasText: "Corte y barba" }).click();
    await page.locator("label.opcion", { hasText: "Añadir asesoría" }).click();
    await expect(page.locator("form > div.sticky")).toContainText("S/ 350");
    await page.getByRole("button", { name: /Elegir día y hora/ }).click();

    await page.locator("label.opcion", { hasText: "Nilber" }).click();
    const libres = await page.locator('input[name="fecha"]:not([disabled])').evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value));
    expect(libres.length).toBeGreaterThan(0);
    for (const f of libres) expect(new Date(`${f}T12:00:00Z`).getUTCDay(), `${f} debería ser jueves`).toBe(4);
    await page.locator(`label.chip:has(input[name="fecha"][value="${libres[0]}"])`).click();
    await page.locator("label.chip", { hasText: "Tarde" }).click();
    await page.getByRole("button", { name: /Dónde te atendemos/ }).click();

    await page.getByRole("button", { name: /Enviar solicitud/ }).click();
    await expect(page.getByText(/Necesitamos tu autorización/)).toBeVisible();
    await page.selectOption('select[name="zonaId"]', { label: "San Isidro" });
    await page.fill('input[name="direccion"]', "Calle de prueba 456");
    await page.fill('input[name="nombre"]', `${PREFIJO} Movil`);
    await page.fill('input[name="whatsapp"]', "+51 900 000 103");
    await page.check('input[name="consentimientoDatos"]');
    await page.getByRole("button", { name: /Enviar solicitud/ }).click();

    await page.waitForURL("**/reserva/confirmacion");
    await expect(page.locator("body")).toContainText("Ya la tiene Nilber.");
    await expect(page.locator("body")).toContainText("S/ 350");
    await expect(page.locator("body")).toContainText("aún no está confirmada");
  });
});

test.describe("Escritorio: formulario de la portada", () => {
  test("muestra el total antes de enviar y envía la solicitud", async ({ page }) => {
    await page.goto("/#reserva");
    const f = page.locator('form[aria-label="Solicitud de cita"]');
    await f.locator("label.chip", { hasText: "Barba y perfilado" }).click();
    await f.locator("label.chip", { hasText: "Nilber" }).click();
    await f.locator('select[name="zonaId"]').selectOption({ label: "Miraflores" });
    await f.locator('input[name="fecha"]').fill(proximo(4));
    await f.locator("label.chip", { hasText: "Noche" }).click();
    await f.locator('input[name="direccion"]').fill("Av. de prueba 789");
    await f.locator('input[name="nombre"]').fill(`${PREFIJO} Escritorio`);
    await f.locator('input[name="whatsapp"]').fill("900000104");
    await f.locator('input[name="consentimientoDatos"]').check();
    await expect(f).toContainText("S/ 100");
    await f.getByRole("button", { name: /Enviar solicitud/ }).click();
    await page.waitForURL("**/reserva/confirmacion");
    await expect(page.locator("body")).toContainText("Miraflores");
  });
});
