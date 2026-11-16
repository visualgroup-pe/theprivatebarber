import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { BARBERO_PRUEBA, CUENTAS, hayBaseDeDatos, PREFIJO, servicio } from "./datos";
import limpiar from "./limpiar";

/**
 * Antes de las pruebas: deja la base sin restos de una corrida anterior y crea
 * un barbero de prueba (todos los días, 9–21) con su cuenta, y una cuenta de admin.
 */
export default async function preparar() {
  if (!hayBaseDeDatos()) {
    console.log("Sin Supabase en .env.local: solo corren las pruebas que no escriben.");
    return;
  }
  await limpiar();
  const s = servicio();
  const { data: barbero } = await s
    .from("barberos")
    .insert({ slug: BARBERO_PRUEBA, nombre: `${PREFIJO} Barbero`, anos_oficio: 1, whatsapp: "911111112", orden: 99 })
    .select("id")
    .single()
    .throwOnError();
  await s
    .from("horarios")
    .insert([1, 2, 3, 4, 5, 6, 7].map((d) => ({ barbero_id: barbero!.id, dia_semana: d, hora_inicio: "09:00", hora_fin: "21:00" })))
    .throwOnError();

  const crear = async (email: string, rol: "admin" | "barber", nombre: string) => {
    const clave = randomBytes(12).toString("base64url");
    const { data, error } = await s.auth.admin.createUser({ email, password: clave, email_confirm: true });
    if (error) throw error;
    await s.from("perfiles").insert({ id: data.user.id, rol, nombre }).throwOnError();
    return { email, clave, id: data.user.id };
  };
  const admin = await crear("e2e.admin@example.com", "admin", `${PREFIJO} Admin`);
  const barberoCuenta = await crear("e2e.barbero@example.com", "barber", `${PREFIJO} Barbero`);
  await s.from("barberos").update({ user_id: barberoCuenta.id }).eq("id", barbero!.id).throwOnError();
  writeFileSync(CUENTAS, JSON.stringify({ admin, barbero: barberoCuenta }));
}
