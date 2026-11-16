import { expect, test } from "@playwright/test";

/** Sitio público, SEO y criterios generales (no escriben en la base). */

const PAGINAS = [
  ["/", /Barbería privada a domicilio/],
  ["/reserva", /Reservar una cita/],
  ["/resenas", /Reseñas/],
  ["/privacidad", /Política de privacidad/],
  ["/terminos", /Términos y condiciones/],
  ["/libro-de-reclamaciones", /Libro de Reclamaciones/],
] as const;

for (const [ruta, titulo] of PAGINAS) {
  test(`${ruta}: carga sin errores, con título, canónica y Open Graph`, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    // Vercel Analytics solo existe en Vercel: en local su script da 404.
    page.on("console", (m) => m.type() === "error" && !m.location().url.includes("/_vercel/") && errores.push(m.text()));
    const r = await page.goto(ruta);
    expect(r?.status()).toBe(200);
    await expect(page).toHaveTitle(titulo);
    const canonica = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonica).toMatch(new RegExp(`${ruta === "/" ? "/?$" : `${ruta}$`}`));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\.jpg$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
    expect(errores).toEqual([]);
  });
}

test("portada: datos estructurados HairSalon con los cinco distritos y el horario", async ({ page }) => {
  await page.goto("/");
  const datos = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(datos["@type"]).toBe("HairSalon");
  expect(datos.areaServed.map((z: { name: string }) => z.name.replace(", Lima", ""))).toEqual(
    expect.arrayContaining(["San Isidro", "Miraflores", "Santiago de Surco", "San Borja", "La Molina"]),
  );
  expect(datos.openingHoursSpecification[0]).toMatchObject({ opens: "09:00", closes: "21:00" });
  expect(datos.openingHoursSpecification[0].dayOfWeek).toHaveLength(6);
  expect(datos.hasOfferCatalog.itemListElement.every((o: { priceCurrency: string }) => o.priceCurrency === "PEN")).toBe(true);
});

test("sitemap.xml y robots.txt", async ({ request }) => {
  const mapa = await (await request.get("/sitemap.xml")).text();
  for (const r of ["/reserva", "/resenas", "/privacidad", "/terminos", "/libro-de-reclamaciones"]) expect(mapa).toContain(r);
  expect(mapa).not.toContain("/admin");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /barbero");
  expect(robots).toContain("Sitemap:");
});

test("el pie enlaza privacidad, términos y el Libro de Reclamaciones", async ({ page }) => {
  await page.goto("/");
  const legal = page.getByRole("navigation", { name: "Legal" });
  for (const [texto, ruta] of [
    ["Política de privacidad", "/privacidad"],
    ["Términos y condiciones", "/terminos"],
    ["Libro de Reclamaciones", "/libro-de-reclamaciones"],
  ]) {
    await expect(legal.getByRole("link", { name: texto })).toHaveAttribute("href", ruta);
  }
});

test("la carta muestra precios en soles y la asesoría a S/ 50", async ({ page }) => {
  await page.goto("/");
  const carta = page.locator("#servicios");
  for (const precio of ["S/ 200", "S/ 100", "S/ 300", "S/ 50"]) await expect(carta).toContainText(precio);
});

test("con movimiento reducido no hay animaciones", async ({ browser }) => {
  const contexto = await browser.newContext({ reducedMotion: "reduce" });
  const page = await contexto.newPage();
  await page.goto("/");
  const animadas = await page.evaluate(
    () => [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).animationName !== "none").length,
  );
  expect(animadas).toBe(0);
  await contexto.close();
});

test("página inexistente: 404 en español", async ({ page }) => {
  const r = await page.goto("/no-existe");
  expect(r?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("no existe");
});

test("a 390 px no hay desplazamiento horizontal", async ({ browser }) => {
  const contexto = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await contexto.newPage();
  for (const ruta of ["/", "/reserva", "/resenas", "/libro-de-reclamaciones"]) {
    await page.goto(ruta);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), ruta).toBe(0);
  }
  await contexto.close();
});

test("Libro de Reclamaciones: valida en el navegador y en el servidor (sin JavaScript)", async ({ page, browser }) => {
  await page.goto("/libro-de-reclamaciones");
  await page.getByRole("button", { name: /Enviar hoja/ }).click();
  await expect(page.locator(".campo__error").first()).toBeVisible();
  await expect(page.locator('[name="nombre"]')).toBeFocused();
  await page.fill('[name="numeroDocumento"]', "1234");
  await page.getByRole("button", { name: /Enviar hoja/ }).click();
  await expect(page.getByText("El DNI tiene 8 dígitos.")).toBeVisible();

  const sinJs = await browser.newContext({ javaScriptEnabled: false });
  const p2 = await sinJs.newPage();
  await p2.goto("/libro-de-reclamaciones");
  await p2.getByRole("button", { name: /Enviar hoja/ }).click();
  await expect(p2.locator(".campo__error").first()).toBeVisible();
  await sinJs.close();
});
