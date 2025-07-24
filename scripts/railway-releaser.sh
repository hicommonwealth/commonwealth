#!/bin/bash

set -e

cd libs/model

# Apply migration to DB
echo "Migrating DB..."
echo ""

# TODO: add DATABASE_URL validation
# TODO: init, baseline, validate in CI

pgroll --postgres-url "$DATABASE_URL" migrate /migrations
echo ""

# Purge the Cloudflare Cache
echo "Purging Cloudflare Cache..."
echo ""
npx -y tsx@^4.7.2 ../../packages/commonwealth/server/scripts/purgeCloudflareCache.ts