#!/bin/bash

set -e

cd libs/model

# Apply migration to DB
echo "Migrating DB..."
echo ""

npx -y --package=sequelize@^6.32.1 --package=sequelize-cli@^6.2.0 --package=pg@^8.11.3 sequelize-cli db:migrate --config sequelize.json
echo ""

# Purge the Cloudflare Cache
echo "Purging Cloudflare Cache..."
echo ""
npx -y tsx@^4.7.2 ../../packages/commonwealth/server/scripts/purgeCloudflareCache.ts