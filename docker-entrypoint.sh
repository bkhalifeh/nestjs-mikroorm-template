#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
node dist/migrate.js

echo "[entrypoint] Starting application..."
exec node dist/main
