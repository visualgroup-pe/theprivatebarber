import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { barberos as barberosRespaldo, type Barbero } from "@/content/barberos";
import { servicios as serviciosRespaldo, type Servicio } from "@/content/servicios";
import { zonas as zonasRespaldo } from "@/content/zonas";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { crearClientePublico } from "@/lib/supabase/server";

/**
 * Catálogo de la web: servicios, zonas y barberos con sus horarios.
 * Se lee de Supabase (el panel de administración lo cambia sin desplegar) y
 * se guarda en caché con la etiqueta «catalogo»; el panel la invalida con
 * revalidateTag. Sin Supabase configurado, usa los datos de content/.
 */
export const ETIQUETA_CATALOGO = "catalogo";

export type Zona = { id: string; distrito: string };

export async function obtenerServicios(): Promise<Servicio[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(ETIQUETA_CATALOGO);
  return leerServicios();
}

/** Sin caché: para validar una solicitud con los datos del momento. */
export async function leerServicios(): Promise<Servicio[]> {
  if (!supabaseConfigurado()) return serviciosRespaldo;

  const { data, error } = await crearClientePublico()
    .from("servicios")
    .select("id, slug, nombre, descripcion, descripcion_corta, duracion_texto, precio_pen, duracion_min, duracion_max, es_adicional")
    .eq("activo", true)
    .order("orden");
  if (error) throw new Error(`No se pudo leer la carta: ${error.message}`);
  return data.map((s) => ({
    id: s.id,
    slug: s.slug,
    nombre: s.nombre,
    precioPen: s.precio_pen,
    duracionMin: s.duracion_min,
    duracionMax: s.duracion_max,
    esAdicional: s.es_adicional,
    descripcion: s.descripcion,
    descripcionCorta: s.descripcion_corta,
    duracionTexto: s.duracion_texto,
  }));
}

export async function obtenerZonas(): Promise<Zona[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(ETIQUETA_CATALOGO);
  return leerZonas();
}

/** Sin caché: para validar una solicitud con los datos del momento. */
export async function leerZonas(): Promise<Zona[]> {
  if (!supabaseConfigurado()) return zonasRespaldo.map((d) => ({ id: d, distrito: d }));

  const { data, error } = await crearClientePublico()
    .from("zonas")
    .select("id, distrito")
    .eq("activo", true)
    .order("orden");
  if (error) throw new Error(`No se pudieron leer las zonas: ${error.message}`);
  return data;
}

export async function obtenerBarberos(): Promise<Barbero[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(ETIQUETA_CATALOGO);
  return leerBarberos();
}

/** Sin caché: para validar una solicitud con los datos del momento. */
export async function leerBarberos(): Promise<Barbero[]> {
  if (!supabaseConfigurado()) return barberosRespaldo;

  // Columnas públicas solamente: el rol anon no puede leer whatsapp ni user_id.
  const { data, error } = await crearClientePublico()
    .from("barberos")
    .select("id, slug, nombre, foto_url, anos_oficio, especialidad, horarios (dia_semana, hora_inicio, hora_fin)")
    .eq("activo", true)
    .order("orden");
  if (error) throw new Error(`No se pudieron leer los barberos: ${error.message}`);
  return data.map((b) => ({
    id: b.id,
    slug: b.slug,
    nombre: b.nombre,
    fotoUrl: b.foto_url,
    anosOficio: b.anos_oficio,
    especialidad: b.especialidad,
    horarios: (b.horarios ?? [])
      .map((h) => ({ diaSemana: h.dia_semana, horaInicio: h.hora_inicio.slice(0, 5), horaFin: h.hora_fin.slice(0, 5) }))
      .sort((x, y) => x.diaSemana - y.diaSemana),
  }));
}
