import { expect, test, type Page } from "@playwright/test";
import { cuentas, hayBaseDeDatos, ids, MOVIL, PREFIJO, proximo, servicio, solicitudValida, type Cuenta } from "./datos";

/** Paneles del barbero y de administración con Supabase Auth. */
test.skip(!hayBaseDeDatos(), "Necesita Supabase (.env.local)");

async function ingresar(page: Page, cuenta: Cuenta, destino: string) {
  await page.goto("/ingresar");
  await page.fill('input[name="correo"]', cuenta.email);
  await page.fill('input[name="clave"]', cuenta.clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL(`**${destino}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
}

test("sin sesión, los paneles piden ingresar; contraseña errada da un mensaje claro", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/ingresar\?siguiente=%2Fadmin/);
  await page.goto("/barbero");
  await expect(page).toHaveURL(/\/ingresar/);
  await page.fill('input[name="correo"]', cuentas().admin.email);
  await page.fill('input[name="clave"]', "incorrecta-123");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("incorrectos");
});

test.describe("Barbero", () => {
  test.use(MOVIL);

  test("ve solo sus citas, la acepta con la hora y queda en el historial", async ({ page, request }) => {
    const id = await ids();
    const propia = (await (await request.post("/api/solicitudes", { data: solicitudValida(id, { whatsapp: "900000110" }) })).json()).resumen.id;
    const ajena = (
      await (
        await request.post("/api/solicitudes", {
          data: solicitudValida(id, { barberoId: id.nilber, fecha: proximo(4), whatsapp: "900000111", nombre: `${PREFIJO} Ajena` }),
        })
      ).json()
    ).resumen.id;

    await ingresar(page, cuentas().barbero, "/barbero");
    const inicio = page.locator("main:visible");
    await expect(inicio).toContainText(`${PREFIJO} Cliente`);
    await expect(inicio).not.toContainText(`${PREFIJO} Ajena`);

    await page.goto(`/barbero/cita/${ajena}`);
    await expect(page.locator("body")).toContainText("no existe");
    await expect(page.locator("body")).not.toContainText(`${PREFIJO} Ajena`);
    await page.goto("/admin");
    await page.waitForURL("**/barbero");

    await page.goto(`/barbero/cita/${propia}`);
    await expect.poll(async () => (await servicio().from("citas").select("estado").eq("id", propia).single()).data?.estado).toBe("pendiente");
    const aceptar = page.locator("details", { hasText: "Aceptar" }).first();
    await aceptar.locator('select[name="hora"]').selectOption("15:30");
    await aceptar.locator('button[type="submit"]').click();
    await expect.poll(async () => (await servicio().from("citas").select("estado, hora_confirmada").eq("id", propia).single()).data).toEqual({
      estado: "confirmada",
      hora_confirmada: "15:30:00",
    });
    const { data: eventos } = await servicio().from("cita_eventos").select("estado_nuevo, actor, nota").eq("cita_id", propia).order("id");
    expect(eventos?.map((e) => [e.estado_nuevo, e.actor])).toEqual([
      ["solicitud_recibida", "cliente"],
      ["pendiente", "barber"],
      ["confirmada", "barber"],
    ]);
    expect(eventos?.at(-1)?.nota).toBe("Hora: 15:30");
  });
});

test.describe("Administración", () => {
  test("propone otro horario y registra que el cliente aceptó", async ({ page, request }) => {
    const id = await ids();
    const cita = (await (await request.post("/api/solicitudes", { data: solicitudValida(id, { whatsapp: "900000112" }) })).json()).resumen.id;
    await ingresar(page, cuentas().admin, "/admin");
    await page.goto(`/admin/citas/${cita}`);
    const propuesta = page.locator("details", { hasText: "Proponer otro horario" });
    await propuesta.locator("summary").click();
    await propuesta.locator('input[name="propuestaFecha"]').fill(proximo(5));
    await propuesta.locator('select[name="propuestaFranja"]').selectOption("noche");
    await propuesta.locator('select[name="propuestaHora"]').selectOption("19:00");
    await propuesta.locator('button[type="submit"]').click();
    await expect.poll(async () => (await servicio().from("citas").select("estado").eq("id", cita).single()).data?.estado).toBe("reprogramacion");
    await page.reload();
    await page.locator("details", { hasText: "El cliente aceptó" }).locator('button[type="submit"]').click();
    await expect
      .poll(async () => (await servicio().from("citas").select("estado, fecha, hora_confirmada").eq("id", cita).single()).data)
      .toEqual({ estado: "confirmada", fecha: proximo(5), hora_confirmada: "19:00:00" });
  });

  test("un cambio de precio en el panel se ve en la web al instante", async ({ page }) => {
    const { data: temporal } = await servicio()
      .from("servicios")
      .insert({ slug: "prueba-e2e-servicio", nombre: `${PREFIJO} Servicio`, precio_pen: 123, orden: 98 })
      .select("id")
      .single()
      .throwOnError();
    await ingresar(page, cuentas().admin, "/admin");
    await page.goto("/admin/servicios");
    const fila = page.locator(`form[aria-label="Editar ${PREFIJO} Servicio"]`);
    await fila.locator('input[name="precio_pen"]').fill("456");
    await fila.getByRole("button", { name: "Guardar" }).click();
    await expect(fila.locator("[role=status]")).toContainText("Guardado");
    await page.goto("/");
    await expect(page.locator("#servicios")).toContainText(`${PREFIJO} Servicio`);
    await expect(page.locator("#servicios")).toContainText("S/ 456");
    await servicio().from("servicios").delete().eq("id", temporal!.id);
  });

  test("abre todas las secciones y al salir vuelve a pedir ingreso", async ({ page }) => {
    await ingresar(page, cuentas().admin, "/admin");
    for (const ruta of ["/admin/citas", "/admin/citas/nueva", "/admin/servicios", "/admin/barberos", "/admin/zonas", "/admin/reclamaciones"]) {
      const r = await page.goto(ruta);
      expect(r?.status(), ruta).toBe(200);
    }
    await page.goto("/admin");
    await page.getByRole("button", { name: "Salir" }).click();
    await page.waitForURL("**/ingresar");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/ingresar/);
  });
});
