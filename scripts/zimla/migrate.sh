#!/bin/bash
# Zimla Kontor: kör databasmigreringar som inte redan körts (de tål inte att köras två gånger).
# Varje fil körs i en egen transaktion och noteras i zimla_ops.applied_migrations. Avbryter vid första fel.
# Filer som själva har BEGIN/COMMIT körs som de är och noteras efteråt.
set -euo pipefail
cd "${1:?ange release-katalogen}"   # migreringarna ur den release som driftsätts
PSQL=(docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -X -q -U postgres -d postgres)
"${PSQL[@]}" -c "create schema if not exists zimla_ops; create table if not exists zimla_ops.applied_migrations (name text primary key, sha256 text not null, applied_at timestamptz not null default now());"
record_sql() { printf "insert into zimla_ops.applied_migrations(name, sha256) values ('%s', '%s');\n" "$1" "$2"; }
run() {
  local name=$1 file=$2 sum
  sum=$(sha256sum "$file" | cut -d' ' -f1)
  if [ -n "$("${PSQL[@]}" -tAc "select 1 from zimla_ops.applied_migrations where name = '$name'")" ]; then return 0; fi
  echo "$(date +%T) $name"
  if grep -qiE '^\s*(begin|commit)\s*;' "$file"; then
    "${PSQL[@]}" < "$file"
    record_sql "$name" "$sum" | "${PSQL[@]}"
  else
    { echo "begin;"; cat "$file"; echo; record_sql "$name" "$sum"; echo "commit;"; } | "${PSQL[@]}"
  fi
}
run bootstrap.sql supabase/bootstrap.sql
for f in supabase/migrations/*.sql; do run "$(basename "$f")" "$f"; done
echo "KLART: $("${PSQL[@]}" -tAc "select count(*) from zimla_ops.applied_migrations") körda"
