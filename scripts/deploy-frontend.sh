#!/usr/bin/env bash
#
# Deploy the BitFinite Mempool frontend to seed-1.
#
# ── CRITICAL nginx routing note ────────────────────────────────────────────
# The vhost (/etc/nginx/sites-available/mempool.bitfinitechain.org) routes:
#
#     map $http_accept_language $lang { default en-US; ... }
#     root /var/www/mempool/browser;
#     location / { try_files /$lang/$uri /$lang/$uri/ $uri $uri/ /en-US/$uri @index-redirect; }
#
# For ANY request (incl. /resources/*.png and /light.css) nginx tries
# /en-US/<uri> FIRST and only falls back to the web root if the en-US copy is
# missing. So the served copy of every asset lives in browser/en-US/, NOT the
# web root. A past bug excluded /resources/ from the en-US sync, which left
# browser/en-US/resources/ frozen at the first-ever deploy — updated images
# (e.g. the About-page logo) showed stale forever, immune to Cloudflare purges
# and ?v= cache-busts, because the ORIGIN itself served the old file.
#
# Therefore this script syncs the FULL build (app + resources + light.css) into
# en-US/, and additionally mirrors resources/ + light.css to the web root as a
# harmless fallback. Never re-introduce an --exclude for /resources/.
# ───────────────────────────────────────────────────────────────────────────
set -euo pipefail

REMOTE="${MEMPOOL_DEPLOY_REMOTE:-user@your-server}"
REMOTE_ROOT="${MEMPOOL_DEPLOY_ROOT:-/var/www/mempool/browser}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../frontend" && pwd)"
DIST="$FRONTEND_DIR/dist/explorer/browser"

cd "$FRONTEND_DIR"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "==> Building frontend (production, single-locale)…"
  pnpm run generate-config
  npx ng build --configuration=production --localize=false
  pnpm run sync-assets
else
  echo "==> SKIP_BUILD=1 — reusing existing $DIST"
fi

[ -d "$DIST" ] || { echo "ERROR: build output missing: $DIST" >&2; exit 1; }
[ -d "$DIST/resources" ] || { echo "ERROR: $DIST/resources missing — did sync-assets run?" >&2; exit 1; }

echo "==> Deploying FULL build → $REMOTE:$REMOTE_ROOT/en-US/ (nginx-served copy)…"
# No --exclude here: resources MUST land in en-US/resources/ (see header note).
rsync -az "$DIST/" "$REMOTE:$REMOTE_ROOT/en-US/"

echo "==> Mirroring resources/ + light.css → web root (fallback copies)…"
rsync -az "$DIST/resources/" "$REMOTE:$REMOTE_ROOT/resources/"
ssh "$REMOTE" "cp -f '$REMOTE_ROOT/en-US/light.css' '$REMOTE_ROOT/light.css' 2>/dev/null || true"

echo "==> Verifying served asset sizes match (root vs en-US)…"
ssh "$REMOTE" '
  b="'"$REMOTE_ROOT"'"
  for f in resources/explorer_bitcoin_cash_logo_bigger.png light.css; do
    r=$(stat -c%s "$b/$f" 2>/dev/null || echo "?")
    e=$(stat -c%s "$b/en-US/$f" 2>/dev/null || echo "?")
    tag="OK"; [ "$r" = "$e" ] || tag="MISMATCH(root=$r en-US=$e — en-US is the served one)"
    echo "  $f: $tag"
  done'

echo "==> Done. Remember to purge Cloudflare (or rely on ?v= query on fixed-name assets)."
