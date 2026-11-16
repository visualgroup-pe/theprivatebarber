#!/usr/bin/env node
/**
 * Comprueba el proyecto de Supabase real con supabase-js, como lo hará la web:
 * el visitante lee el catálogo y no puede tocar datos privados; el servidor
 * crea una solicitud y la borra al terminar.
 * Uso: node --env-file=.env.local scripts/verificar-remoto.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secreta = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !publica || !secreta) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL, la clave pública o la secreta en .env.local.");
  process.exit(1);
}
const opciones = { auth: { persistSession: false, autoRefreshToken: false } };
const visitante = createClient(url, publica, opciones);
const servidor = createClient(url, secreta, opciones);

let fallas = 0;
const ok = (cond, nombre, extra = "") => {
  console.log(`${cond ? "ok" : "FALLA"}: ${nombre}${extra ? ` → ${extra}` : ""}`);
  if (!cond) fallas++;
};

// ── Visitante (clave pública) ──
const servicios = await visitante.from("servicios").select("slug, precio_pen").eq("activo", true).order("orden");
ok(!servicios.error && servicios.data.length === 4, "el visitante lee la carta", servicios.error?.message ?? servicios.data.map((s) => `${s.slug} ${s.precio_pen}`).join(", "));
const zonas = await visitante.from("zonas").select("distrito").eq("activo", true);
ok(!zonas.error && zonas.data.length === 5, "el visitante lee las 5 zonas");
const barberos = await visitante
  .from("barberos")
  .select("slug, nombre, horarios (dia_semana, hora_inicio, hora_fin)")
  .eq("activo", true)
  .order("orden");
ok(
  !barberos.error && barberos.data.length === 2 && barberos.data[0].horarios.length === 1,
  "el visitante lee barberos con sus horarios",
  barberos.error?.message ?? barberos.data.map((b) => `${b.nombre}: ${b.horarios.length} días`).join(", "),
);
const wsp = await visitante.from("barberos").select("whatsapp");
ok(Boolean(wsp.error), "el visitante no ve el WhatsApp de los barberos", wsp.error?.message);
const clientes = await visitante.from("clientes").select("id");
ok(Boolean(clientes.error), "el visitante no lee clientes", clientes.error?.message);

// ── Servidor (clave secreta): una solicitud de prueba ──
const { data: ids } = await servidor.from("barberos").select("id, slug");
const { data: serv } = await servidor.from("servicios").select("id, slug");
const { data: zona } = await servidor.from("zonas").select("id").eq("distrito", "San Isidro").single();
const { data: hoy } = await servidor.rpc("hoy_lima");
const fecha = new Date(`${hoy}T12:00:00Z`);
fecha.setUTCDate(fecha.getUTCDate() + ((4 - (fecha.getUTCDay() || 7) + 7) % 7) + 7); // un jueves futuro
const params = {
  p_nombre: "Prueba Automática",
  p_whatsapp: "900000001",
  p_correo: null,
  p_consentimiento_datos: true,
  p_consentimiento_marketing: false,
  p_barbero: ids.find((b) => b.slug === "nilber").id,
  p_servicio: serv.find((s) => s.slug === "corte-y-barba").id,
  p_con_asesoria: true,
  p_zona: zona.id,
  p_distrito_otro: null,
  p_lugar: "casa",
  p_direccion: "Prueba",
  p_referencia: null,
  p_fecha: fecha.toISOString().slice(0, 10),
  p_franja: "tarde",
};
const directo = await visitante.rpc("crear_solicitud", params);
ok(
  directo.error?.code === "42501",
  "el visitante no puede crear solicitudes directo (solo por la ruta de API)",
  directo.error?.message,
);
const cita = await servidor.rpc("crear_solicitud", params);
ok(
  !cita.error && cita.data.estado === "solicitud_recibida" && cita.data.precio_total_pen === 350,
  "el servidor crea una solicitud (S/ 350, «solicitud recibida»)",
  cita.error?.message ?? `${cita.data.fecha} tarde`,
);
const lunes = await servidor.rpc("crear_solicitud", {
  p_nombre: "Prueba Automática",
  p_whatsapp: "900000001",
  p_correo: null,
  p_consentimiento_datos: true,
  p_consentimiento_marketing: false,
  p_barbero: ids.find((b) => b.slug === "nilber").id,
  p_servicio: serv.find((s) => s.slug === "corte-a-medida").id,
  p_con_asesoria: false,
  p_zona: zona.id,
  p_distrito_otro: null,
  p_lugar: "casa",
  p_direccion: null,
  p_referencia: null,
  p_fecha: new Date(fecha.getTime() + 4 * 864e5).toISOString().slice(0, 10), // lunes siguiente
  p_franja: "manana",
});
ok(lunes.error?.message === "sin_horario", "un lunes con Nilber se rechaza", lunes.error?.message);

// Limpieza
if (cita.data?.id) {
  await servidor.from("citas").delete().eq("id", cita.data.id);
  await servidor.from("clientes").delete().eq("whatsapp", "900000001");
}
const resto = await servidor.from("clientes").select("id").eq("whatsapp", "900000001");
ok(resto.data?.length === 0, "datos de prueba borrados");

console.log(fallas ? `\n${fallas} comprobaciones fallaron.` : "\nTodo bien en el proyecto real.");
process.exit(fallas ? 1 : 0);
