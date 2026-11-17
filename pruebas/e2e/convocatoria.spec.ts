import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { evaluarPostulacion } from "@/lib/convocatoria";
import { correos, cuentas, esperarAvisos, hayBaseDeDatos, PREFIJO, servicio, type Cuenta } from "./datos";

/** Convocatoria de barberos: página pública, fotos privadas y gestión en el panel. */

const foto = (n: string) => join(__dirname, "..", "..", "public", "img", n);
const BASE = {
  anosOficio: 5,
  tecnicas: ["tijera", "maquina", "navaja"],
  fotos: 3,
  instagram: null,
  herramientasPropias: true,
  compromisoHigiene: true,
  compromisoPuntualidad: true,
  zonas: ["Miraflores"],
};

test("evaluación: cumple solo con todos los requisitos, y dice qué falta", () => {
  expect(evaluarPostulacion(BASE)).toEqual({ cumple: true, faltan: [] });
  expect(evaluarPostulacion({ ...BASE, anosOficio: 2 }).faltan).toEqual(["oficio"]);
  expect(evaluarPostulacion({ ...BASE, tecnicas: ["tijera", "maquina"] }).faltan).toEqual(["tecnica"]);
  // Menos de 3 fotos vale si hay Instagram
  expect(evaluarPostulacion({ ...BASE, fotos: 1 }).faltan).toEqual(["trabajos"]);
  expect(evaluarPostulacion({ ...BASE, fotos: 0, instagram: "@corte" }).cumple).toBe(true);
  expect(evaluarPostulacion({ ...BASE, herramientasPropias: false, zonas: [] }).faltan).toEqual(["maletin", "zonas"]);
});

test("la página muestra requisitos y proceso, y está enlazada desde el pie", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer").getByRole("link", { name: "Trabaja con nosotros" })).toHaveAttribute("href", "/convocatoria");
  await page.goto("/convocatoria");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Buscamos");
  await expect(page.locator("aside")).toContainText("3 años de oficio o más");
  await expect(page.locator("aside")).toContainText("Tijera, máquina y navaja");
  await expect(page.getByRole("heading", { name: "Cómo es el proceso" })).toBeVisible();
});

test("valida antes de enviar y lleva al primer error", async ({ page }) => {
  await page.goto("/convocatoria");
  const f = page.locator('form[aria-label="Postulación de barbero"]');
  await f.getByRole("button", { name: /Enviar postulación/ }).click();
  await expect(f).toContainText("Escribe tu nombre completo.");
  await expect(f).toContainText("Sube fotos de tus trabajos o escribe tu Instagram.");
  await expect(f).toContainText("Elige al menos un día.");
  await expect(f).toContainText("Necesitamos tu autorización");
  await expect(f.locator('input[name="nombre"]')).toBeFocused();
});

test.describe("con Supabase", () => {
  test.skip(!hayBaseDeDatos(), "Necesita Supabase (.env.local)");
  test.describe.configure({ mode: "serial" });

  let idPostulacion = "";

  async function completar(page: Page, nombre: string, whatsapp: string) {
    const f = page.locator('form[aria-label="Postulación de barbero"]');
    await f.locator('input[name="nombre"]').fill(nombre);
    await f.locator('input[name="numeroDocumento"]').fill("44556677");
    await f.locator('input[name="whatsapp"]').fill(whatsapp);
    await f.locator('input[name="correo"]').fill("postulante.e2e@example.com");
    await f.locator('input[name="distritoResidencia"]').fill("Surquillo");
    await f.locator('input[name="anosOficio"]').fill("6");
    for (const t of ["Corte a tijera", "Corte a máquina", "Perfilado a navaja", "Barba con toalla caliente"]) {
      await f.locator("label.chip", { hasText: t }).click();
    }
    await f.locator('textarea[name="experiencia"]').fill("Seis años en una barbería de Miraflores, con clientela propia.");
    for (const t of ["Jueves", "Viernes", "Tarde", "Noche", "Miraflores", "San Isidro"]) {
      await f.locator("label.chip", { hasText: t }).click();
    }
    await f.locator('select[name="movilidad"]').selectOption("moto");
    for (const n of ["herramientasPropias", "compromisoHigiene", "compromisoPuntualidad", "consentimientoDatos"]) {
      await f.locator(`input[name="${n}"]`).check();
    }
    return f;
  }

  test("postula con fotos: se suben privadas, la que se quita se borra y la administración recibe el aviso", async ({ page, request }) => {
    await page.goto("/convocatoria");
    const f = await completar(page, `${PREFIJO} Postulante`, "900000301");

    await f.locator('input[type="file"]').setInputFiles([foto("barba.jpg"), foto("peinado.jpg"), foto("corte-ventana.jpg"), foto("herramientas.jpg")]);
    const subidas = f.getByRole("list", { name: "Fotos subidas" }).locator("li");
    await expect(subidas.locator("img")).toHaveCount(4, { timeout: 30_000 });
    await f.getByRole("button", { name: "Quitar foto 4" }).click();
    await expect(subidas.locator("img")).toHaveCount(3);

    await f.getByRole("button", { name: /Enviar postulación/ }).click();
    await expect(page.getByRole("status")).toContainText("Gracias, Prueba.");

    const { data: p } = await servicio()
      .from("postulaciones")
      .select("*")
      .eq("whatsapp", "900000301")
      .single();
    idPostulacion = p.id;
    expect(p).toMatchObject({ estado: "nueva", cumple_requisitos: true, requisitos_faltantes: [], anos_oficio: 6 });
    expect(p.fotos).toHaveLength(3);
    expect(p.zonas.sort()).toEqual(["Miraflores", "San Isidro"]);

    // En Storage quedan solo las 3 fotos enviadas, y no son públicas.
    const { data: archivos } = await servicio().storage.from("postulaciones").list(p.id);
    expect(archivos).toHaveLength(3);
    const publica = await request.get(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/postulaciones/${p.fotos[0]}`);
    expect(publica.ok()).toBe(false);

    // Ya enviada, no acepta más fotos.
    const otra = await request.post("/api/convocatoria/fotos", { data: { id: p.id } });
    expect(otra.status()).toBe(409);

    const l = await esperarAvisos((l) => correos(l, "Nueva postulación").length > 0 && correos(l, "Recibimos tu postulación").length > 0);
    const [aviso] = correos(l, "Nueva postulación");
    expect(aviso.json.to).toEqual(["admin.e2e@example.com"]);
    expect(aviso.json.subject).toContain("cumple los requisitos");
    expect(aviso.json.html).toContain(`/admin/postulaciones/${p.id}`);
    expect(correos(l, "Recibimos tu postulación")[0].json.to).toEqual(["postulante.e2e@example.com"]);
  });

  test("quien no cumple también puede postular, y queda marcado con lo que le falta", async ({ page }) => {
    await page.goto("/convocatoria");
    const f = await completar(page, `${PREFIJO} Aprendiz`, "900000302");
    await f.locator('input[name="anosOficio"]').fill("1");
    await f.locator('input[name="instagram"]').fill("@aprendiz.e2e");
    await f.getByRole("button", { name: /Enviar postulación/ }).click();
    await expect(page.getByRole("status")).toContainText("Gracias, Prueba.");
    const { data: p } = await servicio().from("postulaciones").select("*").eq("whatsapp", "900000302").single();
    expect(p).toMatchObject({ cumple_requisitos: false, requisitos_faltantes: ["oficio"], fotos: [] });
  });

  async function ingresar(page: Page, cuenta: Cuenta) {
    await page.goto("/ingresar?siguiente=/admin/postulaciones");
    await page.fill('input[name="correo"]', cuenta.email);
    await page.fill('input[name="clave"]', cuenta.clave);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.waitForURL("**/admin/postulaciones");
  }

  test("la administración la revisa con sus fotos, la aprueba y crea la ficha del barbero", async ({ page }) => {
    await ingresar(page, cuentas().admin);
    const main = page.locator("main:visible");
    await expect(main).toContainText(`${PREFIJO} Postulante`);
    await expect(main).not.toContainText(`${PREFIJO} Aprendiz`);
    await page.getByRole("link", { name: "No cumplen" }).click();
    await expect(page.locator("main:visible")).toContainText(`${PREFIJO} Aprendiz`);
    await expect(page.locator("main:visible")).toContainText("Le falta: 3 años de oficio o más");

    await page.goto(`/admin/postulaciones/${idPostulacion}`);
    const detalle = page.locator("main:visible");
    await expect(detalle).toContainText("Cumple los requisitos");
    const imagenes = detalle.getByRole("list", { name: "Fotos de trabajos" }).locator("img");
    await expect(imagenes).toHaveCount(3);
    await expect
      .poll(() => imagenes.evaluateAll((es) => es.filter((e) => (e as HTMLImageElement).naturalWidth > 0).length))
      .toBe(3);

    const gestion = detalle.locator('form[aria-label="Estado de la postulación"]');
    await gestion.locator('select[name="estado"]').selectOption("aprobada");
    await gestion.locator('textarea[name="notas"]').fill("Prueba de oficio impecable.");
    await gestion.getByRole("button", { name: "Guardar" }).click();
    await expect(gestion.getByRole("status")).toHaveText("Guardado.");

    await page.reload();
    const ficha = page.locator('main:visible form[aria-label="Crear ficha de barbero"]');
    await ficha.getByRole("button", { name: "Crear ficha de barbero" }).click();
    await expect(ficha.getByRole("status")).toContainText("Ficha creada");

    const { data: p } = await servicio().from("postulaciones").select("barbero_id").eq("id", idPostulacion).single();
    const { data: b } = await servicio().from("barberos").select("nombre, activo, whatsapp, anos_oficio").eq("id", p!.barbero_id).single();
    expect(b).toEqual({ nombre: `${PREFIJO} Postulante`, activo: false, whatsapp: "900000301", anos_oficio: 6 });
  });

  test("borrar una postulación elimina también sus fotos", async ({ page }) => {
    await ingresar(page, cuentas().admin);
    await page.goto(`/admin/postulaciones/${idPostulacion}`);
    const borrar = page.locator('main:visible form[aria-label="Borrar postulación"]');
    await borrar.getByRole("button", { name: /Borrar postulación/ }).click();
    await expect(borrar.getByRole("alert")).toContainText("Escribe BORRAR");
    await borrar.locator('input[name="confirmar"]').fill("BORRAR");
    await borrar.getByRole("button", { name: /Borrar postulación/ }).click();
    await page.waitForURL("**/admin/postulaciones");
    const { count } = await servicio().from("postulaciones").select("id", { count: "exact", head: true }).eq("id", idPostulacion);
    expect(count).toBe(0);
    const { data: archivos } = await servicio().storage.from("postulaciones").list(idPostulacion);
    expect(archivos).toHaveLength(0);
  });
});
