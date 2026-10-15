#!/bin/bash
# Driftsätter Zimla Kontor på kontor.zimla.io från den commit som är utcheckad (måste vara ren och pushad).
#   scripts/zimla/deploy-kontor.sh
# 1. Packar exakt den commiten (git archive) – samma arkiv blir /kallkod (AGPL-3.0 avsnitt 13).
# 2. Väntar på att GitHub Actions byggt imagen ghcr.io/whipflashx/zimla-kontor:<sha> (servern bygger aldrig:
#    next build behöver ~6 GB och fick servern att swappa ihjäl sig 2026-10-15).
# 3. Servern hämtar imagen, kör nya migreringar, byter appen och väntar på health.
set -euo pipefail
SERVER=${KONTOR_SERVER:-root@136.148.214.15}
cd "$(git rev-parse --show-toplevel)"
[ -z "$(git status --porcelain)" ] || { echo "Arbetskatalogen är inte ren – committa först." >&2; exit 1; }
SHA=$(git rev-parse --short=7 HEAD)
git fetch -q origin && git merge-base --is-ancestor HEAD origin/main || { echo "Commiten $SHA finns inte på origin/main – pusha först." >&2; exit 1; }
FULL=$(git rev-parse HEAD)
echo "→ väntar på imagen för $SHA (GitHub Actions)"
for i in $(seq 1 90); do
  RUN=$(gh run list -R whipflashx/zimla-kontor --workflow image.yml --commit "$FULL" --json databaseId,status,conclusion -q '.[0]' 2>/dev/null || true)
  case "$RUN" in
    *'"conclusion":"success"'*) break ;;
    *'"conclusion":"'[a-z]*) echo "Bygget i GitHub Actions misslyckades: $RUN" >&2; exit 1 ;;
  esac
  sleep 20
done
case "$RUN" in *'"conclusion":"success"'*) ;; *) echo "Imagen blev inte klar i tid." >&2; exit 1 ;; esac
ARCHIVE=zimla-kontor-$SHA.tar.gz
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
git archive --format=tar.gz --prefix="zimla-kontor-$SHA/" -o "$TMP/$ARCHIVE" HEAD
echo "→ $ARCHIVE ($(du -h "$TMP/$ARCHIVE" | cut -f1)) till servern"
ssh "$SERVER" 'mkdir -p /opt/kontor-releases /var/www/kontor-kallkod'
scp -q "$TMP/$ARCHIVE" "$SERVER:/opt/kontor-releases/$ARCHIVE"
ssh "$SERVER" SHA="$SHA" ARCHIVE="$ARCHIVE" 'bash -s' <<'REMOTE'
set -euo pipefail
REL=/opt/kontor-releases/zimla-kontor-$SHA
rm -rf "$REL" && tar -xzf "/opt/kontor-releases/$ARCHIVE" -C /opt/kontor-releases
echo "→ hämtar ghcr.io/whipflashx/zimla-kontor:$SHA"
docker pull -q "ghcr.io/whipflashx/zimla-kontor:$SHA" >/dev/null
echo "→ migreringar"
bash "$REL/scripts/zimla/migrate.sh" "$REL" | tail -1
mkdir -p /opt/kontor
cp "$REL/docker-compose.yml" /opt/kontor/docker-compose.yml
cp "$REL/scripts/zimla/docker-compose.override.yml" /opt/kontor/docker-compose.override.yml
rm -rf /opt/kontor/docker && cp -r "$REL/docker" /opt/kontor/docker
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$SHA/" /opt/kontor/.env
# Engångsbyte från grundinstallationen (/opt/accounted, Accounteds image) till /opt/kontor.
if [ -f /opt/accounted/docker-compose.yml ]; then (cd /opt/accounted && docker compose down >/dev/null 2>&1) && mv /opt/accounted /opt/accounted-grund; fi
cd /opt/kontor && docker compose up -d --build --remove-orphans >/dev/null 2>&1 || true
for i in $(seq 1 40); do
  s=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || echo saknas)
  [ "$s" = healthy ] && break; sleep 5
done
[ "$s" = healthy ] || { echo "Appen blev inte frisk ($s)" >&2; docker compose logs --tail 30 app >&2; exit 1; }
docker compose up -d >/dev/null 2>&1   # cron väntar på frisk app
cp "/opt/kontor-releases/$ARCHIVE" "/var/www/kontor-kallkod/$ARCHIVE"
ln -sfn "$ARCHIVE" /var/www/kontor-kallkod/current.tar.gz
echo "✓ zimla-kontor:$SHA kör, /kallkod = $ARCHIVE"
REMOTE
