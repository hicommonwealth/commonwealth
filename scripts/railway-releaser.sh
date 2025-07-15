#!/bin/bash

set -e

# Apply migration to DB
echo "Migrating DB..."
echo ""
npx -y sequelize@^6.32.1 sequelize-cli@^6.2.0 db:migrate --config packages/commonwealth/server/sequelize.json
echo ""

# Purge the Cloudflare Cache
echo "Purging Cloudflare Cache..."
echo ""
npx -y tsx@^4.7.2 packages/commonwealth/server/scripts/purgeCloudflareCache.ts