#!/bin/sh
set -eu

persist_dir="${WRANGLER_PERSIST_DIR:-/var/lib/hyperion-worker}"
mkdir -p "$persist_dir"

./node_modules/.bin/wrangler d1 migrations apply hyperion-operator-local \
  --config wrangler.docker.toml \
  --local \
  --persist-to "$persist_dir"

exec ./node_modules/.bin/wrangler dev \
  --config wrangler.docker.toml \
  --local \
  --ip 0.0.0.0 \
  --port 8787 \
  --var "SITE_ORIGIN:${HYPERION_SITE_ORIGIN:-http://localhost:8080}" \
  --persist-to "$persist_dir"
