import { rmSync } from "node:fs";
import { BARBERO_PRUEBA, CUENTAS, hayBaseDeDatos, PREFIJO, servicio } from "./datos";

/** Después de las pruebas: borra todo lo que crearon (prefijo «Prueba E2E»). */
export default async function limpiar() {
  rmSync(CUENTAS, { force: true });
  if (!hayBaseDeDatos()) return;
  const s = servicio();

  // Citas de clientes de prueba o del barbero de prueba (y sus avisos).
  const { data: clientes } = await s.from("clientes").select("id").like("nombre", `${PREFIJO}%`);
  const { data: barbero } = await s.from("barberos").select("id").eq("slug", BARBERO_PRUEBA).maybeSingle();
  const { data: citas } = await s
    .from("citas")
    .select("id")
    .or(
      [
        clientes?.length ? `cliente_id.in.(${clientes.map((c) => c.id).join(",")})` : null,
        barbero ? `barbero_id.eq.${barbero.id}` : null,
      ]
        .filter(Boolean)
        .join(",") || "id.is.null",
    );
  const idsCitas = (citas ?? []).map((c) => c.id);
  if (idsCitas.length) {
    await s.from("avisos").delete().in("cita_id", idsCitas);
    await s.from("citas").delete().in("id", idsCitas);
  }
  if (clientes?.length) await s.from("clientes").delete().in("id", clientes.map((c) => c.id));

  // Hojas de reclamación de prueba; el correlativo vuelve al último número real.
  const { data: hojas } = await s.from("reclamaciones").select("id").like("nombre", `${PREFIJO}%`);
  if (hojas?.length) {
    await s.from("avisos").delete().in("reclamacion_id", hojas.map((h) => h.id));
    await s.from("reclamaciones").delete().in("id", hojas.map((h) => h.id));
    const { data: anios } = await s.from("correlativos").select("anio");
    for (const { anio } of anios ?? []) {
      const { data: ultima } = await s
        .from("reclamaciones")
        .select("numero")
        .eq("anio", anio)
        .order("numero", { ascending: false })
        .limit(1)
        .maybeSingle();
      await s.from("correlativos").update({ ultimo: ultima?.numero ?? 0 }).eq("anio", anio);
    }
  }

  // Servicios temporales, barbero y cuentas de prueba.
  await s.from("servicios").delete().like("nombre", `${PREFIJO}%`);
  if (barbero) await s.from("barberos").delete().eq("id", barbero.id);
  const { data: usuarios } = await s.auth.admin.listUsers({ perPage: 1000 });
  for (const u of usuarios?.users ?? []) {
    if (u.email?.startsWith("e2e.") && u.email.endsWith("@example.com")) await s.auth.admin.deleteUser(u.id);
  }
}
