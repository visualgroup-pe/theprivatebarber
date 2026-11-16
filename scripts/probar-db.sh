#!/usr/bin/env bash
# Prueba las migraciones, las semillas y los permisos en un Postgres local
# desechable (sin Docker). Uso: npm run db:probar
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PUERTO="${PUERTO:-54329}"
DATOS="$(mktemp -d)"
export PGHOST="$DATOS" PGPORT="$PUERTO" PGUSER=postgres PGDATABASE=postgres

limpiar() {
  "$PGBIN/pg_ctl" -D "$DATOS/db" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$DATOS"
}
trap limpiar EXIT

# initdb no corre como root: usamos el usuario postgres si hace falta.
COMO=()
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$DATOS"
  COMO=(runuser -u postgres --)
fi

"${COMO[@]}" "$PGBIN/initdb" -D "$DATOS/db" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
"${COMO[@]}" "$PGBIN/pg_ctl" -D "$DATOS/db" -o "-p $PUERTO -k $DATOS -c listen_addresses=''" -w start >/dev/null

PSQL=("$PGBIN/psql" -X -q -v ON_ERROR_STOP=1)

echo "→ Shim de Supabase"
"${PSQL[@]}" -f "$RAIZ/supabase/pruebas/shim-supabase.sql"
for m in "$RAIZ"/supabase/migrations/*.sql; do
  echo "→ $(basename "$m")"
  "${PSQL[@]}" -f "$m"
done
echo "→ seed.sql"
"${PSQL[@]}" -f "$RAIZ/supabase/seed.sql"
echo "→ seed.sql otra vez (no duplica)"
"${PSQL[@]}" -f "$RAIZ/supabase/seed.sql"
echo "→ Pruebas"
"${PSQL[@]}" -f "$RAIZ/supabase/pruebas/reglas-y-permisos.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: NOTICE:  /  /'
