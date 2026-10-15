#!/bin/bash
# Driftsätter Zimla Kontor på kontor.zimla.io från den commit som är utcheckad (måste vara ren och pushad).
#   scripts/zimla/deploy-kontor.sh
# 1. Packar exakt den commiten (git archive) – samma arkiv blir /kallkod (AGPL-3.0 avsnitt 13).
# 2. Bygger imagen zimla-kontor:<sha> på servern, kör nya migreringar, byter appen och väntar på health.
set -euo pipefail
SERVER=${KONTOR_SERVER:-root@136.148.214.15}
cd "$(git rev-parse --show-toplevel)"
[ -z "$(git status --porcelain)" ] || { echo "Arbetskatalogen är inte ren – committa först." >&2; exit 1; }
SHA=$(git rev-parse --short=7 HEAD)
git fetch -q origin && git merge-base --is-ancestor HEAD origin/main || { echo "Commiten $SHA finns inte på origin/main – pusha först." >&2; exit 1; }
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
echo "→ bygger zimla-kontor:$SHA (tar en stund)"
docker build -q -f "$REL/docker/Dockerfile" -t "zimla-kontor:$SHA" "$REL" >/dev/null
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
