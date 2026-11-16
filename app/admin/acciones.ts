"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ResultadoAccion } from "@/lib/acciones/citas";
import { obtenerUsuario } from "@/lib/auth";
import { ETIQUETA_CATALOGO } from "@/lib/catalogo";
import { mensajeDeError } from "@/lib/estados";
import { erroresPorCampo, esquemaSolicitud, normalizarWhatsapp, OTRO_DISTRITO_ID } from "@/lib/esquemas/solicitud";
import { crearClienteServicio } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";

/**
 * Acciones de administración. Cada una comprueba el rol admin; además, las
 * consultas usan la sesión del usuario, así que RLS lo vuelve a exigir.
 */
async function sesionAdmin() {
  const usuario = await obtenerUsuario();
  if (usuario?.rol !== "admin") return null;
  return { usuario, supabase: await crearClienteServidor() };
}
const SIN_PERMISO: ResultadoAccion = { ok: false, mensaje: "Tu sesión terminó o no tienes permiso. Vuelve a ingresar." };

const texto = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const casilla = (fd: FormData, k: string) => fd.get(k) === "on";
const entero = z.coerce.number().int();

function slugDe(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** El sitio público lee el catálogo con caché: se refresca al instante. */
function refrescarCatalogo(...rutas: string[]) {
  updateTag(ETIQUETA_CATALOGO);
  for (const r of rutas) revalidatePath(r);
}

function errorDb(error: { message: string; code?: string } | null, porDefecto = "No se pudo guardar."): ResultadoAccion {
  if (!error) return null;
  if (error.code === "23505") return { ok: false, mensaje: "Ya existe un registro con ese nombre." };
  if (error.code === "23514") return { ok: false, mensaje: "Revisa los valores: alguno no es válido." };
  return { ok: false, mensaje: `${porDefecto} ${mensajeDeError(error.message)}` };
}

// ── Servicios ─────────────────────────────────────────────────────

const esquemaServicio = z.object({
  nombre: z.string().min(2, "Escribe el nombre."),
  descripcion: z.string().max(300),
  descripcion_corta: z.string().max(120),
  duracion_texto: z.string().max(40),
  precio_pen: entero.min(0, "El precio no puede ser negativo.").max(10000),
  orden: entero.min(0).max(999),
  activo: z.boolean(),
});

function servicioDe(fd: FormData) {
  return esquemaServicio.safeParse({
    nombre: texto(fd, "nombre"),
    descripcion: texto(fd, "descripcion"),
    descripcion_corta: texto(fd, "descripcion_corta"),
    duracion_texto: texto(fd, "duracion_texto"),
    precio_pen: texto(fd, "precio_pen"),
    orden: texto(fd, "orden") || "0",
    activo: casilla(fd, "activo"),
  });
}

export async function guardarServicio(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const d = servicioDe(fd);
  if (!d.success) return { ok: false, mensaje: d.error.issues[0].message };
  const { error } = await s.supabase.from("servicios").update(d.data).eq("id", texto(fd, "id"));
  const fallo = errorDb(error);
  if (fallo) return fallo;
  refrescarCatalogo("/admin/servicios");
  return { ok: true, mensaje: "Guardado. La web ya muestra el cambio." };
}

export async function crearServicio(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const d = servicioDe(fd);
  if (!d.success) return { ok: false, mensaje: d.error.issues[0].message };
  const { error } = await s.supabase.from("servicios").insert({ ...d.data, slug: slugDe(d.data.nombre), duracion_min: 45, duracion_max: 60 });
  const fallo = errorDb(error);
  if (fallo) return fallo;
  refrescarCatalogo("/admin/servicios");
  return { ok: true, mensaje: "Servicio creado." };
}

// ── Zonas ─────────────────────────────────────────────────────────

export async function guardarZona(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const distrito = texto(fd, "distrito");
  const orden = entero.safeParse(texto(fd, "orden") || "0");
  if (distrito.length < 3 || !orden.success) return { ok: false, mensaje: "Revisa el distrito y el orden." };
  const id = texto(fd, "id");
  const fila = { distrito, orden: orden.data, activo: casilla(fd, "activo") };
  const { error } = id
    ? await s.supabase.from("zonas").update(fila).eq("id", id)
    : await s.supabase.from("zonas").insert({ ...fila, activo: true });
  const fallo = errorDb(error);
  if (fallo) return fallo;
  refrescarCatalogo("/admin/zonas");
  return { ok: true, mensaje: id ? "Guardado." : "Distrito agregado." };
}

// ── Barberos y horarios ───────────────────────────────────────────

export async function guardarBarbero(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const nombre = texto(fd, "nombre");
  const anos = texto(fd, "anos_oficio");
  const wsp = normalizarWhatsapp(texto(fd, "whatsapp"));
  if (nombre.length < 2) return { ok: false, mensaje: "Escribe el nombre." };
  if (wsp && !/^9\d{8}$/.test(wsp)) return { ok: false, mensaje: "El WhatsApp tiene 9 dígitos y empieza con 9." };
  const fila = {
    nombre,
    foto_url: texto(fd, "foto_url") || null,
    anos_oficio: anos ? Number(anos) : null,
    especialidad: texto(fd, "especialidad") || null,
    whatsapp: wsp || null,
    orden: Number(texto(fd, "orden") || 0),
    activo: casilla(fd, "activo"),
  };
  const id = texto(fd, "id");
  const { error } = id
    ? await s.supabase.from("barberos").update(fila).eq("id", id)
    : await s.supabase.from("barberos").insert({ ...fila, slug: slugDe(nombre), activo: true });
  const fallo = errorDb(error);
  if (fallo) return fallo;
  refrescarCatalogo("/admin/barberos");
  return { ok: true, mensaje: id ? "Guardado." : "Barbero agregado. Ahora define su horario." };
}

export async function agregarHorario(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const dia = Number(texto(fd, "dia_semana"));
  const inicio = texto(fd, "hora_inicio");
  const fin = texto(fd, "hora_fin");
  if (!(dia >= 1 && dia <= 7) || !inicio || !fin || fin <= inicio) {
    return { ok: false, mensaje: "Elige el día y una hora de fin posterior a la de inicio." };
  }
  const { error } = await s.supabase
    .from("horarios")
    .insert({ barbero_id: texto(fd, "barbero_id"), dia_semana: dia, hora_inicio: inicio, hora_fin: fin });
  const fallo = errorDb(error);
  if (fallo) return fallo;
  refrescarCatalogo("/admin/barberos");
  return { ok: true, mensaje: "Horario agregado." };
}

export async function borrarHorario(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const { error } = await s.supabase.from("horarios").delete().eq("id", texto(fd, "id"));
  const fallo = errorDb(error, "No se pudo quitar.");
  if (fallo) return fallo;
  refrescarCatalogo("/admin/barberos");
  return { ok: true, mensaje: "Horario quitado." };
}

/**
 * Crea la cuenta de acceso de un barbero (correo y contraseña temporal) y la
 * vincula a su ficha. Usa la clave de servicio solo para crear el usuario en
 * Supabase Auth, después de comprobar que quien lo pide es admin.
 */
export async function crearCuentaBarbero(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const datos = z
    .object({
      barberoId: z.uuid(),
      correo: z.email({ error: "Escribe un correo válido." }),
      clave: z.string().min(10, "La contraseña temporal debe tener al menos 10 caracteres."),
    })
    .safeParse({ barberoId: texto(fd, "barbero_id"), correo: texto(fd, "correo"), clave: texto(fd, "clave") });
  if (!datos.success) return { ok: false, mensaje: datos.error.issues[0].message };

  const { data: barbero } = await s.supabase.from("barberos").select("id, nombre, user_id").eq("id", datos.data.barberoId).maybeSingle();
  if (!barbero) return { ok: false, mensaje: "No encontramos al barbero." };
  if (barbero.user_id) return { ok: false, mensaje: "Este barbero ya tiene una cuenta vinculada." };

  const servicio = crearClienteServicio();
  const { data: creado, error } = await servicio.auth.admin.createUser({
    email: datos.data.correo,
    password: datos.data.clave,
    email_confirm: true,
  });
  if (error || !creado.user) {
    return { ok: false, mensaje: error?.message.includes("already") ? "Ya existe una cuenta con ese correo." : "No se pudo crear la cuenta." };
  }
  const { error: e2 } = await s.supabase.from("perfiles").insert({ id: creado.user.id, rol: "barber", nombre: barbero.nombre });
  const { error: e3 } = await s.supabase.from("barberos").update({ user_id: creado.user.id }).eq("id", barbero.id);
  if (e2 || e3) {
    await servicio.auth.admin.deleteUser(creado.user.id);
    return { ok: false, mensaje: "No se pudo vincular la cuenta. Inténtalo de nuevo." };
  }
  revalidatePath("/admin/barberos");
  return { ok: true, mensaje: `Cuenta creada. ${barbero.nombre} ya puede ingresar en /ingresar con ese correo.` };
}

// ── Reclamaciones ─────────────────────────────────────────────────

export async function responderReclamacion(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const respuesta = texto(fd, "respuesta");
  if (respuesta.length < 10) return { ok: false, mensaje: "Escribe la respuesta al consumidor." };
  const { error } = await s.supabase
    .from("reclamaciones")
    .update({ respuesta, respondido_en: new Date().toISOString() })
    .eq("id", texto(fd, "id"));
  const fallo = errorDb(error);
  if (fallo) return fallo;
  // TODO etapa 7: enviar la respuesta al correo del consumidor.
  revalidatePath("/admin/reclamaciones");
  return { ok: true, mensaje: "Respuesta guardada." };
}

// ── Solicitud registrada a mano (llegó por WhatsApp) ──────────────

type ArgsCrear = Database["public"]["Functions"]["crear_solicitud"]["Args"];

export async function registrarSolicitud(_p: ResultadoAccion, fd: FormData): Promise<ResultadoAccion> {
  const s = await sesionAdmin();
  if (!s) return SIN_PERMISO;
  const d = esquemaSolicitud.safeParse({
    servicioId: texto(fd, "servicioId"),
    conAsesoria: casilla(fd, "conAsesoria"),
    barberoId: texto(fd, "barberoId"),
    fecha: texto(fd, "fecha"),
    franja: texto(fd, "franja") || undefined,
    lugar: texto(fd, "lugar") || undefined,
    zonaId: texto(fd, "zonaId"),
    distritoOtro: texto(fd, "distritoOtro") || undefined,
    direccion: texto(fd, "direccion"),
    nombre: texto(fd, "nombre"),
    whatsapp: texto(fd, "whatsapp"),
    correo: texto(fd, "correo") || undefined,
    consentimientoDatos: casilla(fd, "consentimientoDatos"),
    consentimientoMarketing: casilla(fd, "consentimientoMarketing"),
  });
  if (!d.success) {
    const errores = erroresPorCampo(d.error);
    return { ok: false, mensaje: Object.values(errores).join(" ") };
  }
  const v = d.data;
  const otro = v.zonaId === OTRO_DISTRITO_ID;
  const { data: cita, error } = await s.supabase.rpc("crear_solicitud", {
    p_nombre: v.nombre,
    p_whatsapp: v.whatsapp,
    p_correo: v.correo || null,
    p_consentimiento_datos: v.consentimientoDatos,
    p_consentimiento_marketing: v.consentimientoMarketing,
    p_barbero: v.barberoId,
    p_servicio: v.servicioId,
    p_con_asesoria: v.conAsesoria,
    p_zona: otro ? null : v.zonaId,
    p_distrito_otro: otro ? (v.distritoOtro ?? null) : null,
    p_lugar: v.lugar,
    p_direccion: v.direccion,
    p_referencia: null,
    p_fecha: v.fecha,
    p_franja: v.franja,
    p_origen: "whatsapp",
  } as unknown as ArgsCrear);
  if (error || !cita) return { ok: false, mensaje: mensajeDeError(error?.message) };
  // TODO etapa 7: avisar al barbero de la nueva solicitud.
  revalidatePath("/admin", "layout");
  redirect(`/admin/citas/${cita.id}`);
}
