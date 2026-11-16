#!/usr/bin/env node
/**
 * Aplica migraciones y semillas al proyecto de Supabase por la API de
 * administración (HTTPS), sin conexión directa a Postgres. Registra cada
 * migración en supabase_migrations.schema_migrations, igual que `supabase db push`.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/supabase-remoto.mjs migrar [--semillas]
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/supabase-remoto.mjs sql "select 1"
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/supabase-remoto.mjs tipos > lib/supabase/tipos.ts
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const API = "https://api.supabase.com/v1";
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
if (!token || !ref) {
  console.error("Faltan SUPABASE_ACCESS_TOKEN y SUPABASE_PROJECT_REF.");
  process.exit(1);
}
const raiz = new URL("..", import.meta.url).pathname;

async function api(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opciones.headers },
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${ruta}: ${texto}`);
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

const sql = (query) =>
  api(`/projects/${ref}/database/query`, { method: "POST", body: JSON.stringify({ query }) });

const literal = (s) => `'${s.replaceAll("'", "''")}'`;

async function migrar(conSemillas) {
  await sql(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key, statements text[], name text
    );`);
  const aplicadas = new Set(
    (await sql("select version from supabase_migrations.schema_migrations")).map((f) => f.version),
  );
  const carpeta = join(raiz, "supabase/migrations");
  const archivos = (await readdir(carpeta)).filter((a) => a.endsWith(".sql")).sort();
  for (const archivo of archivos) {
    const [version, ...resto] = archivo.replace(/\.sql$/, "").split("_");
    if (aplicadas.has(version)) {
      console.log(`= ${archivo} (ya aplicada)`);
      continue;
    }
    const cuerpo = await readFile(join(carpeta, archivo), "utf8");
    // Una transacción por migración: si algo falla, no queda a medias.
    await sql(`begin;
${cuerpo}
insert into supabase_migrations.schema_migrations (version, name, statements)
values (${literal(version)}, ${literal(resto.join("_"))}, array[${literal(cuerpo)}]);
commit;`);
    console.log(`+ ${archivo}`);
  }
  if (conSemillas) {
    await sql(await readFile(join(raiz, "supabase/seed.sql"), "utf8"));
    console.log("+ seed.sql");
  }
}

const [orden, ...args] = process.argv.slice(2);
if (orden === "migrar") {
  await migrar(args.includes("--semillas"));
} else if (orden === "sql") {
  console.log(JSON.stringify(await sql(args.join(" ")), null, 2));
} else if (orden === "tipos") {
  const r = await api(`/projects/${ref}/types/typescript?included_schemas=public`);
  process.stdout.write(r.types);
} else {
  console.error("Órdenes: migrar [--semillas] | sql <consulta> | tipos");
  process.exit(1);
}
